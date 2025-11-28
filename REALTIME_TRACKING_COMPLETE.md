# 🚌 Real-Time Tracking Flow - Hoàn chỉnh

## 📋 Tổng quan toàn bộ hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                  TỔNG THỂ HỆ THỐNG TRACKING                 │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   DRIVER DASHBOARD   │
                    ├──────────────────────┤
                    │ • Xem tuyến đường    │
                    │ • Icon xe di chuyển  │
                    │ • Gửi vị trí:        │
                    │   - WebSocket (2s)   │
                    │   - API (2s)         │
                    └──────────────────────┘
                              ▼
                    ┌──────────────────────┐
                    │   BACKEND SERVER     │
                    ├──────────────────────┤
                    │ Socket.io Handler:   │
                    │ Nhận & Broadcast vị  │
                    │ trí tới Phụ huynh    │
                    │                      │
                    │ API Controller:      │
                    │ Lưu vị trí vào DB    │
                    └──────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌──────────────────┐      ┌──────────────────┐
        │ PARENT TRACKING  │      │   DATABASE       │
        ├──────────────────┤      ├──────────────────┤
        │ WebSocket:       │      │ LocationHistory  │
        │ Nhận vị trí      │      │ (Lưu trữ)        │
        │ real-time        │      │                  │
        │                  │      │ - latitude       │
        │ Hiển thị:        │      │ - longitude      │
        │ • Icon xe bus    │      │ - scheduleId     │
        │ • Marker trên map│      │ - timestamp      │
        │ • Tiến độ (%)    │      │ - driverId       │
        └──────────────────┘      └──────────────────┘
```

---

## 🔄 Chi tiết Flow

### 1️⃣ Tài xế gửi vị trí từ Frontend (Driver Dashboard)

**File:** `CNPM_SSB1.0/frontend/src/pages/driver/Dashboard.jsx`

```javascript
// Animation: Xe bus chạy dọc theo tuyến
useEffect(() => {
  let index = 0;
  const interval = setInterval(() => {
    index++;
    const currentPos = routePath[index];

    // Cập nhật vị trí icon
    setBusPos(currentPos);

    // Lưu vào state để gửi
    setBusLocation({
      latitude: currentPos[0],
      longitude: currentPos[1],
    });
  }, 200);
}, [tripStarted, routePath]);

// Gửi vị trí mỗi 2 giây
useEffect(() => {
  const sendInterval = setInterval(() => {
    const locationData = {
      latitude: busLocation.latitude,
      longitude: busLocation.longitude,
      scheduleId: activeTrip.id,
      driverId: user.id,
      progressPercentage: tripProgress.percentage,
      distanceCovered: tripProgress.distanceCovered,
    };

    // ✅ Gửi qua WebSocket (REAL-TIME)
    TrackingService.sendBusLocation(locationData);

    // ✅ Gửi qua API (LƯU VÀO DATABASE)
    TrackingService.saveDriverLocationToBackend(locationData);
  }, 2000);
}, [tripStarted, busLocation, activeTrip]);
```

### 2️⃣ TrackingService - Gửi vị trí

**File:** `CNPM_SSB1.0/frontend/src/services/tracking.service.js`

```javascript
/**
 * Gửi qua WebSocket (real-time cho phụ huynh)
 */
sendBusLocation(locationData) {
  const socket = this.initSocket();
  socket.emit("driver-location-update", {
    ...locationData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Gửi qua API (lưu vào database)
 */
async saveDriverLocationToBackend(locationData) {
  try {
    const response = await api.post("/tracking/save-location", {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      scheduleId: locationData.scheduleId,
      driverId: locationData.driverId,
      progressPercentage: locationData.progressPercentage || 0,
      distanceCovered: locationData.distanceCovered || 0,
    });
    console.log("✅ Location saved to backend API");
  } catch (error) {
    console.error("Error saving location");
  }
}
```

### 3️⃣ Backend nhận & xử lý

#### A) WebSocket Handler (Real-time Broadcast)

**File:** `CNPM_SSB1.0/backend/src/sockets/tracking.handler.js`

```javascript
socket.on("driver-location-update", (data) => {
  console.log("📍 Driver location update received:", data);

  // Validate
  if (!data.latitude || !data.longitude || !data.scheduleId) {
    return;
  }

  // 📢 Broadcast tới tất cả phụ huynh trong "parent-tracking" room
  io.to("parent-tracking").emit("bus-location-update", {
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
    },
    scheduleId: data.scheduleId,
    driverId: data.driverId,
    timestamp: data.timestamp,
    progressPercentage: data.progressPercentage || 0,
    distanceCovered: data.distanceCovered || 0,
    distanceRemaining: data.distanceRemaining || 0,
  });

  console.log(`📤 Broadcasted to parent-tracking room`);
});
```

#### B) API Endpoint (Lưu vào Database)

**File:** `CNPM_SSB1.0/backend/src/api/controllers/tracking.controller.js`

```javascript
/**
 * 🚌 Lưu vị trí xe bus được tài xế gửi từ FE
 * POST /api/tracking/save-location
 */
async function saveDriverLocation(req, res) {
  try {
    const {
      latitude,
      longitude,
      scheduleId,
      driverId,
      progressPercentage,
      distanceCovered,
    } = req.body;

    // Validate
    if (!latitude || !longitude || !scheduleId) {
      return res.status(400).json({
        message: "Missing required fields: latitude, longitude, scheduleId",
      });
    }

    // Lưu vào LocationHistory database
    const locationRecord = await LocationHistory.create({
      schedule_id: scheduleId,
      driver_id: driverId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      progress_percentage: progressPercentage || 0,
      distance_covered: distanceCovered || 0,
    });

    console.log("✅ Driver location saved:", {
      scheduleId,
      latitude,
      longitude,
    });

    res.json({
      message: "Location saved successfully",
      location: {
        id: locationRecord.id,
        latitude: locationRecord.latitude,
        longitude: locationRecord.longitude,
        timestamp: locationRecord.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving location",
      error: error.message,
    });
  }
}
```

**File:** `CNPM_SSB1.0/backend/src/api/routes/tracking.routes.js`

```javascript
// 🚌 Save driver location (từ FE tài xế gửi)
router.post("/save-location", verifyToken, isDriver, saveDriverLocation);
```

### 4️⃣ Phụ huynh nhận vị trí Real-time

**File:** `CNPM_SSB1.0/frontend/src/pages/parent/Location.jsx`

```javascript
useEffect(() => {
  ParentTrackingService.initSocket();
  ParentTrackingService.joinParentTracking();

  // 🚌 Lắng nghe vị trí xe bus từ backend
  ParentTrackingService.onBusLocationUpdate((data) => {
    console.log("🚌 Received bus location update:", data);

    // Cập nhật vị trí marker trên map
    setBusLocation({
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    });

    // Cập nhật tiến độ
    setTripProgress({
      percentage: data.progressPercentage,
      distanceCovered: data.distanceCovered || 0,
      distanceRemaining: data.distanceRemaining || 0,
    });

    setTripInfo((prev) => ({
      ...prev,
      status: "Đang chạy",
      statusColor: "#10b981",
    }));

    setIsTrackingActive(true);
  });

  return () => {
    ParentTrackingService.leaveParentTracking();
  };
}, []);

// Hiển thị icon xe bus trên map
{
  busLocation && (
    <Marker
      position={[busLocation.latitude, busLocation.longitude]}
      icon={busIcon}
    >
      <Popup>
        <strong>🚌 Vị trí xe bus</strong>
        <br />
        Tiến độ: {tripProgress.percentage.toFixed(1)}%
      </Popup>
    </Marker>
  );
}
```

---

## 📊 Data Flow Diagram

```
DRIVER FRONTEND (Browser)
  ↓
  ├─→ WebSocket: "driver-location-update"
  │     { latitude, longitude, scheduleId, ... }
  │     (Mỗi 2 giây)
  │
  └─→ HTTP POST: /api/tracking/save-location
        { latitude, longitude, scheduleId, ... }
        (Mỗi 2 giây)

BACKEND SERVER (Node.js)
  ├─ Socket Handler
  │   ├─ Nhận: "driver-location-update"
  │   └─ Broadcast: "bus-location-update" → parent-tracking room
  │
  └─ API Controller
      ├─ Nhận: POST /api/tracking/save-location
      └─ Lưu: LocationHistory table

DATABASE (Sequelize)
  └─ LocationHistory
      ├─ id
      ├─ schedule_id
      ├─ driver_id
      ├─ latitude
      ├─ longitude
      ├─ progress_percentage
      ├─ distance_covered
      └─ createdAt

PARENT FRONTEND (Browser)
  ↑
  └─ WebSocket: "bus-location-update"
      { location: { latitude, longitude }, progressPercentage, ... }
      (Khi tài xế gửi)

  ↓ (Hiển thị)
  ├─ Icon xe bus marker
  ├─ Progress bar (%)
  ├─ Tiến độ: X km / Y km
  └─ Trạng thái: "Đang chạy"
```

---

## 🧪 Cách Test

### Bước 1: Khởi động Backend & Frontend

```bash
# Terminal 1: Backend
cd CNPM_SSB1.0/backend
npm start

# Terminal 2: Frontend
cd CNPM_SSB1.0/frontend
npm run dev
```

### Bước 2: Mở 2 tab trình duyệt

- **Tab 1 (Driver):** http://localhost:5173

  - Login tài xế
  - Vào Dashboard
  - Click "Bắt đầu chuyến đi"

- **Tab 2 (Parent):** http://localhost:5173
  - Login phụ huynh
  - Vào Tracking (Location page)
  - Xem icon xe bus chạy

### Bước 3: Kiểm tra Console Log

**Driver Console (Tab 1):**

```
✅ OSRM route fetched: 450 coordinates
🚌 Bus moving: { position: [10.77, 106.66], progress: "0.2%", index: 1 }
📤 Sent bus location (WebSocket + API): { latitude: 10.77, longitude: 106.66 }
✅ Location saved to backend API: {...}
... (mỗi 2 giây)
```

**Backend Console:**

```
📍 Driver location update received: { latitude: 10.77, longitude: 106.66, ... }
📤 Broadcasted to parent-tracking room
✅ Driver location saved: { scheduleId: 1, latitude: 10.77, longitude: 106.66 }
... (mỗi 2 giây)
```

**Parent Console (Tab 2):**

```
✅ Parent tracking connected to server
🚌 Received bus location update: { location: { latitude: 10.77, longitude: 106.66 }, ... }
🚌 Received bus location update: { location: { latitude: 10.771, longitude: 106.661 }, ... }
... (mỗi lần tài xế gửi)
```

---

## 📈 Kết quả mong đợi

| Yếu tố                 | Kỳ vọng                    | Status |
| ---------------------- | -------------------------- | ------ |
| **Driver Dashboard**   | Icon xe chạy trên map      | ✅     |
| **Send via WebSocket** | Phụ huynh nhận real-time   | ✅     |
| **Send via API**       | Lưu vào database           | ✅     |
| **Parent Location**    | Icon xe hiển thị real-time | ✅     |
| **Progress Bar**       | Cập nhật %, khoảng cách    | ✅     |
| **Status**             | "Đang chạy" → "Hoàn thành" | ✅     |

---

## 🔧 Troubleshooting

### ❌ Phụ huynh không thấy icon xe bus

**Nguyên nhân:**

- WebSocket không connect
- Driver chưa gửi vị trí

**Giải pháp:**

1. Kiểm tra console: `✅ Parent tracking connected`?
2. Kiểm tra Backend log: `📍 Driver location update received`?
3. Kiểm tra endpoint: `POST /api/tracking/save-location` có response?

### ❌ Vị trí không chính xác

**Nguyên nhân:**

- progressPercentage không tính đúng
- distanceCovered sai

**Giải pháp:**

```javascript
// Kiểm tra công thức
const percentage = (index / Math.max(routePath.length - 1, 1)) * 100;
const distance = index * 0.1; // Điều chỉnh hệ số nếu cần
```

### ❌ Database không lưu vị trí

**Nguyên nhân:**

- LocationHistory model không tồn tại
- API route chưa thêm

**Giải pháp:**

1. Kiểm tra: `backend/src/api/routes/tracking.routes.js`
   - Có route `POST /save-location`?
2. Kiểm tra: `backend/src/data/models.js`
   - Có `LocationHistory` model?

---

## 📚 File thay đổi

| File                                                 | Thay đổi                              |
| ---------------------------------------------------- | ------------------------------------- |
| `frontend/src/pages/driver/Dashboard.jsx`            | Thêm hàm gửi vị trí (WebSocket + API) |
| `frontend/src/services/tracking.service.js`          | Thêm `saveDriverLocationToBackend()`  |
| `frontend/src/pages/parent/Location.jsx`             | Cập nhật state & lắng nghe            |
| `backend/src/sockets/tracking.handler.js`            | Thêm handler `driver-location-update` |
| `backend/src/api/controllers/tracking.controller.js` | Thêm hàm `saveDriverLocation()`       |
| `backend/src/api/routes/tracking.routes.js`          | Thêm route `POST /save-location`      |

---

## 🎯 Tính năng trong tương lai

- [ ] Smooth interpolation vị trí trên Parent map
- [ ] Hiển thị tuyến đường thực tế từ route history
- [ ] ETA động dựa trên vị trí thực
- [ ] Alert phụ huynh khi xe gần tới
- [ ] Replay route sau khi kết thúc chuyến

---

**Cập nhật:** 28/11/2025  
**Status:** ✅ Hoàn thành  
**Version:** 1.0
