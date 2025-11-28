# 🚌 Real-Time Bus Tracking Flow (Tài xế → Phụ huynh)

## 📋 Tổng quan kiến trúc

```
┌─────────────────────────┐
│  Driver Dashboard       │  ← Tài xế xem map & vị trí icon xe bus
├─────────────────────────┤
│  1. Bắt đầu chuyến đi   │
│  2. Icon xe chạy trên   │
│     map (animation)     │
│  3. Lấy vị trí từ icon  │ ──┐
└─────────────────────────┘   │
                              │ WebSocket: "driver-location-update"
                              │ { lat, lng, scheduleId, driverId }
                              ▼
                    ┌─────────────────────┐
                    │  Backend Server     │
                    │  (Socket.io)        │
                    │  tracking.handler.js│
                    └─────────────────────┘
                              │
                              │ Broadcast to "parent-tracking" room
                              │ WebSocket: "bus-location-update"
                              ▼
                    ┌─────────────────────┐
                    │  Parent Tracking    │
                    │  (Location.jsx)     │
                    ├─────────────────────┤
                    │ Nhận vị trí → Update│
                    │ icon xe bus trên map│
                    └─────────────────────┘
```

## 🔄 Flow Chi Tiết

### 1️⃣ Tài xế bắt đầu chuyến đi (Driver Dashboard)

**File:** `CNPM_SSB1.0/frontend/src/pages/driver/Dashboard.jsx`

```javascript
// Khi tài xế click "Bắt đầu chuyến đi"
const handleStartTrip = async (route) => {
  await TrackingService.startTrip(route.id);
  setActiveTrip(route);
  setTripStarted(true); // ← Bắt đầu hiển thị active trip view
};
```

### 2️⃣ Icon xe bus di chuyển trên map

**File:** `CNPM_SSB1.0/frontend/src/pages/driver/Dashboard.jsx`

```javascript
// MapContainer hiển thị route với animation
<MapContainer center={activeTrip.coordinates[0]} zoom={13}>
  {/* Route polyline */}
  <RoutingPolyline waypoints={activeTrip.coordinates} />

  {/* Icon xe bus di chuyển */}
  {busPos && <Marker position={busPos} icon={busIcon} />}
</MapContainer>;

// Animation chạy xe mỗi 200ms
useEffect(() => {
  let index = 0;
  const interval = setInterval(() => {
    index++;
    if (index >= route.length) index = 0;
    setBusPos(route[index]); // ← Cập nhật vị trí icon
  }, 200);
  return () => clearInterval(interval);
}, [route]);
```

### 3️⃣ Tài xế gửi vị trí tới Backend (NEW)

**File:** `CNPM_SSB1.0/frontend/src/services/tracking.service.js`

```javascript
// ✨ Hàm mới để gửi vị trí
sendBusLocation(locationData) {
  const socket = this.initSocket();
  socket.emit("driver-location-update", {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    scheduleId: locationData.scheduleId,
    driverId: locationData.driverId,
    progressPercentage: locationData.progressPercentage,
    distanceCovered: locationData.distanceCovered,
    timestamp: new Date().toISOString(),
  });
}
```

**File:** `CNPM_SSB1.0/frontend/src/pages/driver/Dashboard.jsx`

```javascript
// ⚡ Effect mới: Gửi vị trí mỗi 2 giây
useEffect(() => {
  if (!tripStarted || !busLocation || !activeTrip) return;

  const sendInterval = setInterval(() => {
    if (busLocation) {
      TrackingService.sendBusLocation({
        latitude: busLocation.latitude, // Từ icon xe bus
        longitude: busLocation.longitude, // Từ icon xe bus
        scheduleId: activeTrip.id,
        driverId: user.id,
        progressPercentage: tripProgress.percentage,
        distanceCovered: tripProgress.distanceCovered,
      });
    }
  }, 2000); // Mỗi 2 giây

  return () => clearInterval(sendInterval);
}, [tripStarted, busLocation, activeTrip]);
```

### 4️⃣ Backend nhận vị trí & Broadcast tới Phụ huynh

**File:** `CNPM_SSB1.0/backend/src/sockets/tracking.handler.js`

```javascript
// Lắng nghe event từ tài xế
socket.on("driver-location-update", (data) => {
  console.log("📍 Driver location update received:", data);

  // Phát lại cho tất cả phụ huynh trong "parent-tracking" room
  io.to("parent-tracking").emit("bus-location-update", {
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
    },
    scheduleId: data.scheduleId,
    driverId: data.driverId,
    timestamp: data.timestamp,
    progressPercentage: data.progressPercentage,
    distanceCovered: data.distanceCovered,
  });
});
```

### 5️⃣ Phụ huynh nhận vị trí & Hiển thị trên map

**File:** `CNPM_SSB1.0/frontend/src/pages/parent/Location.jsx`

```javascript
// Khởi tạo socket và join parent tracking room
useEffect(() => {
  ParentTrackingService.initSocket();
  ParentTrackingService.joinParentTracking();

  // Lắng nghe vị trí xe bus từ backend
  ParentTrackingService.onBusLocationUpdate((data) => {
    console.log("🚌 Received bus location update:", data);

    // Cập nhật vị trí marker
    setBusLocation({
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    });

    // Cập nhật tiến độ
    setTripProgress({
      percentage: data.progressPercentage,
      distanceCovered: data.distanceCovered,
      distanceRemaining: data.distanceRemaining,
    });
  });

  return () => {
    ParentTrackingService.leaveParentTracking();
  };
}, []);

// Hiển thị marker xe bus trên map
<MapContainer center={[21.0555, 105.8142]} zoom={13}>
  <TileLayer url="..." />
  {/* Route */}
  <Polyline positions={routeCoordinates} color="#3b82f6" />

  {/* Icon xe bus cập nhật theo real-time */}
  {busLocation && (
    <Marker
      position={[busLocation.latitude, busLocation.longitude]}
      icon={busIcon}
    >
      <Popup>Tiến độ: {tripProgress.percentage.toFixed(1)}%</Popup>
    </Marker>
  )}
</MapContainer>;
```

## 🧪 Kiểm tra Flow

### Bước 1: Khởi động Backend & Frontend

```bash
# Terminal 1: Backend
cd CNPM_SSB1.0/backend
npm start

# Terminal 2: Frontend
cd CNPM_SSB1.0/frontend
npm run dev
```

### Bước 2: Đăng nhập & Mở 2 trình duyệt

- **Tab 1 (Driver):** http://localhost:5173 → Login tài xế → Dashboard
- **Tab 2 (Parent):** http://localhost:5173 → Login phụ huynh → Tracking

### Bước 3: Tài xế bắt đầu chuyến

- Click "Bắt đầu chuyến đi" → Thấy map & icon xe bus chạy

### Bước 4: Phụ huynh kiểm tra Tracking

- Mở Console (F12) của Tab 2 (Parent)
- Xem log: `📍 Bus location update: {...}`
- Icon xe bus trên Parent Location page sẽ di chuyển theo

### Bước 5: Console Log Kiểm Tra

**Driver Dashboard Console:**

```
📤 Sent bus location to backend: { latitude: 10.77, longitude: 106.66 }
📤 Sent bus location to backend: { latitude: 10.771, longitude: 106.661 }
... (mỗi 2 giây)
```

**Backend Console:**

```
📍 Driver location update received: { latitude: 10.77, longitude: 106.66, ... }
📤 Broadcasted location to parent-tracking room: 10.77 106.66
```

**Parent Location Console:**

```
✅ Parent tracking connected to server
🚌 Received bus location update: { location: { latitude: 10.77, longitude: 106.66 }, ... }
```

## 📊 Hiện tại Status

| Thành phần               | Status        | Ghi chú                                          |
| ------------------------ | ------------- | ------------------------------------------------ |
| Driver gửi vị trí        | ✅ Hoàn thành | `sendBusLocation()` được gọi mỗi 2s              |
| Backend nhận & broadcast | ✅ Hoàn thành | `driver-location-update` → `bus-location-update` |
| Parent nhận vị trí       | ✅ Hoàn thành | `onBusLocationUpdate()` callback                 |
| Parent hiển thị icon     | ✅ Hoàn thành | Marker cập nhật real-time                        |

## 🔧 Troubleshooting

### Vấn đề 1: Parent không nhận được vị trí

- **Nguyên nhân:** WebSocket chưa connect hoặc không join "parent-tracking" room
- **Giải pháp:** Kiểm tra console log trong Parent Location, đảm bảo thấy `✅ Parent tracking connected to server`

### Vấn đề 2: Icon xe bus không di chuyển trên Parent map

- **Nguyên nhân:** `busLocation` state chưa update
- **Giải pháp:** Xem console log, đảm bảo Backend đang broadcast vị trí

### Vấn đề 3: Vị trí không chính xác

- **Nguyên nhân:** Tính toán progressPercentage sai
- **Giải pháp:** Kiểm tra `tripProgress.percentage` trong Dashboard của tài xế

## 🎯 Tính năng trong tương lai (Optional)

1. **Smooth animation** trên Parent map (interpolate vị trí)
2. **Lưu lịch sử vị trí** vào database
3. **ETA tính toán động** dựa trên vị trí thực
4. **Alert phụ huynh** khi xe gần tới (cảnh báo 500m)

---

**Cập nhật:** 28/11/2025
**Author:** Dev Team
