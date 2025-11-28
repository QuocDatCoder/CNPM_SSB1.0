# 🧪 Hướng dẫn Test Real-Time Tracking

## ✅ Status

- Backend: **ĐANG CHẠY** 🟢 (npm start)
- Frontend: **ĐANG CHẠY** 🟢 (npm run dev)
- Socket.io: **HOẠT ĐỘNG** 🟢
- API Endpoint: **HOẠT ĐỘNG** 🟢

---

## 📝 Test Plan

### Test 1: Tài xế bắt đầu chuyến đi

**Mục tiêu:** Kiểm tra xe bus chạy trên map driver, icon di chuyển đúng

**Bước:**

1. Mở tab 1: http://localhost:5173
2. Login tài xế (ví dụ: user ID = 2)
3. Vào Dashboard
4. Click "Bắt đầu chuyến đi"

**Kiểm tra Console (Browser - Driver):**

```
✅ OSRM route fetched: 450 coordinates
🚌 Bus moving: { position: [10.77, 106.66], progress: "0.2%", index: 1 }
📤 Sent bus location (WebSocket + API): { latitude: 10.77, longitude: 106.66 }
✅ Location saved to backend API: {...}
```

**Kiểm tra Console (Backend - Terminal):**

```
✅ Driver location saved: { scheduleId: 1, latitude: 10.77, longitude: 106.66 }
POST /api/tracking/save-location 200 14.240 ms - 107
📍 Driver location update received: { latitude: 10.77, longitude: 106.66, ... }
📤 Broadcasted location to parent-tracking room: 10.77 106.66
```

---

### Test 2: Phụ huynh nhận vị trí real-time

**Mục tiêu:** Kiểm tra phụ huynh thấy icon xe bus chạy real-time

**Bước:**

1. Mở tab 2: http://localhost:5173 (cùng một trình duyệt hoặc khác)
2. Login phụ huynh (ví dụ: user ID = 7, có con trên chuyến 1)
3. Vào **Tracking** (hoặc **Location** page)
4. Chọn chuyến đi của con (Schedule ID = 1)

**Kiểm tra Console (Browser - Parent):**

```
✅ Parent tracking connected to socket
✅ Parent joined parent-tracking room
🚌 Received bus location update: {
  location: { latitude: 10.77, longitude: 106.66 },
  progressPercentage: 0.2,
  distanceCovered: 0.1,
  timestamp: '2025-11-28T15:25:36.251Z'
}
```

**Kiểm tra Map (Parent):**

- ✅ Icon xe bus hiện trên map
- ✅ Icon di chuyển theo vị trí tài xế gửi
- ✅ Progress bar tăng (0% → 100%)
- ✅ Khoảng cách cập nhật (0 km → 30 km)
- ✅ Trạng thái: "Đang chạy" 🟢

---

### Test 3: Lưu vị trí vào Database

**Mục tiêu:** Kiểm tra LocationHistory table có dữ liệu từ driver

**Bước:**

1. Chạy backend (Terminal 1)
2. Chạy trigger trip simulation hoặc driver gửi vị trí
3. Kiểm tra backend log: `✅ Driver location saved`
4. Query database:

```sql
SELECT * FROM `location_histories`
WHERE schedule_id = 1
ORDER BY createdAt DESC
LIMIT 10;
```

**Kết quả mong đợi:**

```
id  | schedule_id | driver_id | latitude  | longitude  | progress | distance | createdAt
----|-------------|-----------|-----------|-----------|----------|----------|----------
10  | 1           | 2         | 10.7278   | 106.6781  | 58.39    | 17.4     | 2025-11-28 15:25:54
9   | 1           | 2         | 10.7278   | 106.6781  | 58.39    | 17.4     | 2025-11-28 15:25:52
8   | 1           | 2         | 10.7278   | 106.6801  | 58.39    | 17.4     | 2025-11-28 15:25:50
...
```

---

## 🔍 Debugging Guide

### Lỗi: Phụ huynh không thấy icon xe bus

**Nguyên nhân khả năng:**

1. ❌ WebSocket disconnect
2. ❌ Phụ huynh không join "parent-tracking" room
3. ❌ Driver chưa gửi vị trí
4. ❌ Browser console error

**Kiểm tra:**

```javascript
// Mở Browser Console (F12)
// 1. Check WebSocket connection
console.log(ParentTrackingService.socket?.connected); // true?

// 2. Check nếu join room thành công
// (Kiếm dòng log "✅ Parent joined parent-tracking room")

// 3. Check nếu nhận được update
// (Kiếm dòng log "🚌 Received bus location update")
```

**Giải pháp:**

- ✅ Refresh tab Parent (F5)
- ✅ Kiểm tra Terminal Backend: có log "Client connected" không?
- ✅ Kiểm tra backend log: có "Broadcasted location to parent-tracking" không?

---

### Lỗi: API /api/tracking/save-location 404

**Nguyên nhân:** Backend chưa reload route

**Kiểm tra:**

```bash
# Terminal Backend - kiểm tra:
# 1. Route được mount?
# App listen ở port 8080?

# 2. Query endpoint
curl -X POST http://localhost:8080/api/tracking/save-location \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 10.77,
    "longitude": 106.66,
    "scheduleId": 1,
    "driverId": 2,
    "progressPercentage": 50,
    "distanceCovered": 15
  }'
```

**Giải pháp:**

- ✅ Kill process: `Get-Process node | Stop-Process -Force`
- ✅ Restart: `npm start`

---

### Lỗi: "Cannot read properties of undefined (reading 'to')"

**Nguyên nhân:** `global.io` không được khởi tạo hoặc `startBusSimulator` không nhận `io` parameter

**Giải pháp:**

- ✅ Đã fix: `tracking.controller.js` - dòng `await startBusSimulator(scheduleId, global.io);`
- ✅ Restart backend

---

## 📊 Full Data Flow Test

### Scenario: Tài xế chạy từ Điểm A → Điểm B

```
Timeline:
T=0s   : Tài xế click "Bắt đầu" → Frontend gọi /start-trip
T=0s   : Backend khởi động BusSimulator
T=0.2s : Icon xe bắt đầu chạy dọc theo routePath
T=2s   : Tài xế gửi 1st location update
         - WebSocket: "driver-location-update"
         - API: POST /tracking/save-location
T=2s   : Backend nhận 2 request:
         - Socket handler → broadcast "bus-location-update"
         - API controller → save LocationHistory
T=2s   : Phụ huynh nhận "bus-location-update" → icon update
T=4s   : Tài xế gửi 2nd location → repeat
...
T=300s : Tài xế chạy hết tuyến → finishRoute()
T=300s : Backend emit "route-completed" → set status "hoanthanh"
```

---

## 🎯 Expected Outputs

### Driver Dashboard

- ✅ Icon xe bus chạy mượt
- ✅ Console: `✅ Location saved to backend API` (mỗi 2s)
- ✅ Console: `📤 Sent bus location (WebSocket + API)`

### Parent Location Page

- ✅ Icon xe bus hiện trên map
- ✅ Position update real-time
- ✅ Progress bar tăng
- ✅ Console: `🚌 Received bus location update` (mỗi 2s)

### Backend Terminal

- ✅ `✅ Driver location saved` (mỗi 2s)
- ✅ `POST /api/tracking/save-location 200` (mỗi 2s)
- ✅ `📤 Broadcasted location to parent-tracking room` (mỗi 2s)

### Database (LocationHistory)

- ✅ Mỗi 2 giây có 1-2 record mới
- ✅ `latitude`, `longitude` khác nhau (xe di chuyển)
- ✅ `progress_percentage` tăng từ 0 → 100

---

## 📋 Checklist

- [ ] Backend chạy (npm start)
- [ ] Frontend chạy (npm run dev)
- [ ] Database kết nối
- [ ] Driver login thành công
- [ ] Tài xế bắt đầu chuyến
- [ ] Icon xe chạy trên map
- [ ] Backend log: "Driver location saved"
- [ ] Parent login thành công
- [ ] Parent thấy icon xe
- [ ] Parent icon update real-time
- [ ] Database có LocationHistory records
- [ ] Chuyến đi hoàn thành → status "hoanthanh"

---

## 🚀 Next Steps

Sau khi test xong:

1. **Hiển thị tuyến đường lịch sử:**

   - Fetch `/api/tracking/location-history/:scheduleId`
   - Render polyline từ lịch sử vị trí

2. **ETA (Estimated Time of Arrival):**

   - Tính thời gian còn lại dựa trên speed
   - Hiển thị "Còn ~10 phút nữa"

3. **Notification:**

   - Alert phụ huynh khi xe gần tới
   - Push notification khi kết thúc

4. **Replay Feature:**
   - Phát lại chuyến đi sau khi hoàn thành
   - Animate từng vị trí từ lịch sử

---

**Version:** 1.0  
**Last Updated:** 28/11/2025  
**Status:** ✅ Ready for Testing
