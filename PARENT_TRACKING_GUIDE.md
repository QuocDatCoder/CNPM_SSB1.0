# 🚌 Hướng dẫn Theo dõi Vị trí Xe Bus cho Phụ Huynh

## 📋 Tính Năng

Hệ thống cho phép phụ huynh theo dõi vị trí xe bus **thời gian thực** khi chuyến đi đang diễn ra:

✅ **Icon xe bus di chuyển** trên bản đồ với vị trí GPS realtime
✅ **Tiến độ chuyến đi** (phần trăm hoàn thành)
✅ **Quãng đường đã đi** vs quãng đường còn lại
✅ **Trạng thái chuyến** (Chưa khởi hành → Đang chạy → Hoàn thành)
✅ **Thông tin chi tiết** (Tài xế, Biển số xe, Khoảng cách)
✅ **Socket.io realtime** - Cập nhật mỗi 2 giây

---

## 🏗️ Kiến Trúc Hệ Thống

### Backend (Node.js + Express + Socket.io)

```
backend/
├── src/
│   ├── services/
│   │   └── bus-simulator.service.js    ← Giả lập vị trí xe
│   ├── api/
│   │   ├── controllers/
│   │   │   └── tracking.controller.js  ← API endpoints
│   │   └── routes/
│   │       └── tracking.routes.js      ← Routes
│   └── sockets/
│       └── tracking.handler.js         ← Socket events
```

### Frontend (React + Leaflet + Socket.io)

```
frontend/src/
├── services/
│   └── parent-tracking.service.js      ← Socket client
├── pages/
│   └── parent/
│       ├── Location.jsx                ← Giao diện theo dõi
│       └── Location.css
```

---

## 🔌 Socket Events

### Client → Server

- `join-parent-tracking` - Tham gia room theo dõi
- `leave-parent-tracking` - Rời khỏi room

### Server → Client

- `bus-location-update` - Cập nhật vị trí xe (mỗi 2 giây)
  ```javascript
  {
    scheduleId: 1,
    location: {
      latitude: 21.0285,
      longitude: 105.8542
    },
    progressPercentage: 45.5,
    distanceCovered: 5.2,
    distanceRemaining: 6.8,
    timestamp: "2025-11-28T..."
  }
  ```
- `route-completed` - Chuyến đi hoàn thành

---

## 📡 API Endpoints (Không bắt buộc vì dùng WebSocket)

| Phương thức | Endpoint                                     | Mô tả               |
| ----------- | -------------------------------------------- | ------------------- |
| GET         | `/api/tracking/current-location/:scheduleId` | Lấy vị trí hiện tại |
| GET         | `/api/tracking/location-history/:scheduleId` | Lấy lịch sử vị trí  |

---

## 🧪 Cách Test

### 1️⃣ **Khởi động hệ thống**

Terminal 1 - Backend:

```powershell
cd backend
npm start
```

Terminal 2 - Frontend:

```powershell
cd frontend
npm run dev
```

Backend chạy trên: `http://localhost:8080`
Frontend chạy trên: `http://localhost:5173`

### 2️⃣ **Đăng nhập**

Đăng nhập với tài khoản phụ huynh:

- Email: `phuhuyn@example.com` (hoặc tài khoản phụ huynh đã tạo)
- Mật khẩu: `password`

### 3️⃣ **Xem vị trí xe**

Dashboard Phụ Huynh:

```
http://localhost:5173/parent/dashboard
├── Trang chủ (Home)
├── Vị trí (Location) ← **Click vào đây**
└── Thông báo (Notifications)
```

### 4️⃣ **Khởi động chuyến đi từ Tài xế**

Dashboard Tài xế:

```
http://localhost:5173/driver/dashboard
```

1. Chọn một chuyến đi có trạng thái "chuabatdau"
2. Click nút "Bắt đầu chuyến đi"
3. Backend sẽ khởi động BusSimulator
4. Vị trí xe sẽ được phát sang phụ huynh qua WebSocket

### 5️⃣ **Quan sát**

Giao diện Phụ Huynh - Vị trí:

- ✅ Icon xe bus sẽ di chuyển trên bản đồ
- ✅ Tiến độ (%) tăng liên tục
- ✅ Quãng đường đã đi tăng
- ✅ Trạng thái chuyển từ "Chưa khởi hành" → "Đang chạy"
- ✅ Progress bar xanh hiển thị

---

## 🔧 Cấu hình

### Socket Connection

File: `frontend/src/services/parent-tracking.service.js`

```javascript
this.socket = io("http://localhost:8080", {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

### Bus Simulator Update Interval

File: `backend/src/services/bus-simulator.service.js`

```javascript
// Mỗi 2 giây cập nhật vị trí một lần
this.intervalId = setInterval(() => {
  this.updateLocation();
}, 2000);
```

---

## 📊 Dữ Liệu Được Theo Dõi

### LocationHistory Table

Mỗi update được lưu vào database:

```sql
CREATE TABLE LocationHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distanceCovered DECIMAL(10, 2),
  timestamp DATETIME,
  FOREIGN KEY (schedule_id) REFERENCES Schedule(id)
);
```

---

## 🚀 Quy Trình Hoạt Động

```
1. Tài xế Click "Bắt đầu chuyến đi"
   ↓
2. Backend API /api/tracking/start-trip/:scheduleId
   ↓
3. Cập nhật trạng thái: Schedule.trang_thai = "dangchay"
   ↓
4. Khởi động BusSimulator
   ├─ Load tuyến đường từ database
   ├─ Tính tổng quãng đường (Haversine)
   └─ Bắt đầu cập nhật vị trí
   ↓
5. Mỗi 2 giây:
   ├─ Tính toán vị trí mới (interpolation)
   ├─ Lưu vào LocationHistory
   ├─ Broadcast qua Socket.io:
   │  ├─ admin-tracking (Quản lý)
   │  ├─ driver-{driverId} (Tài xế)
   │  └─ parent-tracking (Phụ huynh) ← **Ở đây**
   └─ Console log vị trí
   ↓
6. Phụ huynh nhận cập nhật realtime
   ├─ Cập nhật busLocation state
   ├─ Map marker di chuyển
   └─ Progress bar tăng
   ↓
7. Khi chuyến đi kết thúc
   ├─ Emit route-completed event
   ├─ Cập nhật trạng thái
   └─ Tài xế & Phụ huynh nhận thông báo
```

---

## 🐛 Troubleshooting

### ❌ Map không hiển thị icon xe

**Kiểm tra:**

- File icon tồn tại: `/frontend/public/icons/busmap.png`
- WebSocket connection OK: Check browser console (F12)
- Backend emit event: Check backend logs

### ❌ Vị trí không cập nhật

**Kiểm tra:**

- Backend terminal có log "📍 Location update"?
- Frontend console có `"🚌 Received bus location update"`?
- Check network tab xem có WebSocket connection?

### ❌ Progress bar không tăng

**Kiểm tra:**

- `tripProgress` state được update?
- Check component re-render: Add `console.log("Progress:", tripProgress)`

### ❌ Socket không kết nối

**Kiểm tra:**

```javascript
console.log(ParentTrackingService.isSocketConnected()); // Should be true
```

---

## 📝 Ghi Chú

1. **Giả lập vs Real GPS**: Hiện tại dùng BusSimulator tính toán vị trị. Sau có thể thay bằng GPS thực từ tài xế.

2. **Performance**: Mỗi 2 giây update 1 lần. Có thể điều chỉnh interval nếu cần (1 giây/5 giây).

3. **Phạm vi phát**: Hiện phát cho tất cả parent trong room "parent-tracking". Có thể optimize sau để phát cho từng phụ huynh cụ thể dựa trên `parent_id`.

4. **Bảo mật**: API endpoints có `verifyToken` + `isParent` middleware.

---

## 📱 Tương Lai

🔄 **Planned Upgrades:**

- [ ] Real GPS từ tài xế (không giả lập)
- [ ] Notification cho phụ huynh khi xe gần tới điểm đón
- [ ] Lịch sử vị trí được lưu có thể xem lại
- [ ] Optimistic phạm vi phát (parent-{scheduleId}-{parentId})
- [ ] Heatmap quãng đường nhiều xe
- [ ] Geofencing (cảnh báo khi ra khỏi tuyến đường)

---

**Tác giả:** Hệ thống Quản lý Xe Bus Thông Minh (CNPM_SSB1.0)
**Phiên bản:** 1.0
**Ngày cập nhật:** 28/11/2025
