# 🧪 Testing Guide - Admin Dashboard Nâng Cấp

**Ngày**: December 9, 2025  
**Thời gian Test**: ~15 phút

---

## 🔧 Chuẩn Bị

### Terminal 1: Backend

```bash
cd backend
npm start

# Xem log:
# ✅ Server listening on port 8080
# ✅ Database connected
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev

# Xem log:
# ✅ VITE ... ready in ... ms
# ✅ Local: http://localhost:5173
```

### Browser

```
Admin tab: http://localhost:5173/admin
Driver tab: http://localhost:5173/driver (nếu test real-time)
```

---

## 📋 Test Case 1: Vẽ Đường Qua Trạm (5 phút)

### ❌ TRƯỚC:

```
Map chỉ hiển thị:
- Polyline từ start → end (bỏ trạm)
- Marker start
- Marker end
- Animation xe
```

### ✅ SAU:

```
Map hiển thị:
- Polyline từ start → stop1 → stop2 → end ✓
- Marker start (xanh)
- Marker stop1 (xanh nhạt)
- Marker stop2 (xanh nhạt)
- Marker end (đỏ)
- Animation xe ✓
```

### Bước Thực Hiện:

**Step 1**: Mở Admin Dashboard

```
http://localhost:5173/admin
```

**Step 2**: F12 → Console

```
Xem logs:
✅ "🔍 Tìm schedule 'dangchay' cho route 1..."
✅ "🔄 Fetching route qua 5 điểm..."
✅ "✅ Route fetched: 523 points qua 5 waypoints"
```

**Step 3**: Xem Map

```
Polyline:
❓ Đi qua các trạm không?
✅ YES → PASS
❌ NO → FAIL

Markers:
❓ Có tất cả start, stops, end?
✅ YES → PASS
❌ NO → FAIL

Animation:
❓ Icon xe di chuyển từ start → end?
✅ YES → PASS
❌ NO → FAIL
```

---

## 📋 Test Case 2: Animation Khi Status ≠ 'dangchay' (3 phút)

### Điều Kiện:

- Route status = 'chuabatdau' (hoặc 'hoanthanh', 'huy')
- Animation phải chạy

### Bước Thực Hiện:

**Step 1**: Kiểm Tra Status

```
Map xem tên route → Status là gì?
- 'chuabatdau': ✅ Should animate
- 'hoanthanh': ✅ Should animate
- 'huy': ✅ Should animate
- 'dangchay': ❌ Should NOT animate (real-time)
```

**Step 2**: F12 → Console

```
Xem logs:
✅ "🎬 Bắt đầu animation xe di chuyển (status không phải dangchay)"
```

**Step 3**: Xem Map

```
Animation:
❓ Icon xe di chuyển liên tục?
✅ YES → PASS
❌ NO → FAIL

Speed:
❓ Mỗi ~200ms một bước?
✅ YES → PASS
❌ NO → FAIL

Loop:
❓ Xe loop từ start → end → start?
✅ YES → PASS
❌ NO → FAIL
```

---

## 📋 Test Case 3: Real-Time Position Khi Status = 'dangchay' (5 phút)

### ⚠️ Yêu Cầu:

- Phải có schedule status = 'dangchay'
- Phải có driver đang chạy
- Hoặc simulate vị trí từ socket

### Scenario A: Thực Tế (Nếu Có Driver)

**Step 1**: Driver Bắt Đầu Chuyến

```
Driver app: Click "Bắt Đầu Chuyến Đi"
Status chuyển thành: 'dangchay'
```

**Step 2**: Admin Chọn Route

```
Admin dashboard: Chọn tuyến đang chạy
F12 → Console xem logs
```

**Step 3**: Xem Console

```
✅ "📡 Thiết lập listener vị trí xe real-time cho route 1"
✅ "✅ Đã subscribe event: bus-location-1"
✅ "📍 Nhận vị trí xe real-time: {...}"
```

**Step 4**: Xem Map

```
Icon xe:
❓ Hiển thị vị trí thực từ driver?
✅ YES → PASS
❌ NO → FAIL

Popup:
❓ Có lat/lon từ socket?
❓ Có thời gian cập nhật?
✅ YES → PASS
❌ NO → FAIL

Animation:
❓ Có animation?
✅ NO (chỉ real-time) → PASS
❌ YES → FAIL (phải dừng animation)
```

---

## 📋 Test Case 4: Chuyển Đổi Status (2 phút)

### Scenario:

1. Status = 'dangchay' → Real-time ✓
2. Driver kết thúc → Status = 'hoanthanh'
3. Chuyển sang Animation ✓

### Bước Thực Hiện:

**Step 1**: Driver Kết Thúc Chuyến

```
Driver app: Click "Kết Thúc"
Status: 'dangchay' → 'hoanthanh'
```

**Step 2**: Admin Xem Console

```
✅ "🔌 Đã unsubscribe event: bus-location-1"
✅ "🎬 Bắt đầu animation xe di chuyển"
```

**Step 3**: Xem Map

```
Icon xe:
❓ Từ real-time → Animation?
✅ YES → PASS
❌ NO → FAIL

Animation:
❓ Icon xe di chuyển từ start?
✅ YES → PASS
❌ NO → FAIL
```

---

## 🔌 Test Case 5: Socket Connection (2 phút)

### DevTools → Network

**Step 1**: Mở Network Tab

```
Ctrl+Shift+I → Network
Filter: WS (WebSocket)
```

**Step 2**: Route Status = 'dangchay'

```
Xem WebSocket:
❓ Có connection?
✅ 101 Switching Protocols → PASS
❌ NO → FAIL
```

**Step 3**: Xem Messages

```
Click WebSocket connection
Tab: Messages
Tìm: "bus-location-1"

Xem payload:
{
  "latitude": 10.7769,
  "longitude": 106.7009,
  "timestamp": "2025-12-09T10:30:00Z",
  ...
}
✅ Có data → PASS
❌ Không data → FAIL
```

---

## 🎯 Pass/Fail Criteria

### PASS ✅ Nếu:

- [ ] Polyline đi qua tất cả trạm
- [ ] Markers hiển thị đúng vị trí
- [ ] Animation chạy khi status ≠ 'dangchay'
- [ ] Real-time hoạt động khi status = 'dangchay'
- [ ] Chuyển đổi status mượt mà
- [ ] Console không có error
- [ ] Socket events được nhận

### FAIL ❌ Nếu:

- [ ] Polyline bỏ trạm
- [ ] Marker hiển thị sai vị trí
- [ ] Animation không chạy
- [ ] Real-time không lấy vị trí
- [ ] Console có error
- [ ] Socket không kết nối

---

## 🐛 Debug Tips

### 1. Kiểm Tra Route Data

**Console**:

```javascript
// Xem selectedRoute
selectedRoute
// Output:
{
  id: 1,
  name: "Tuyến 1",
  start: [10.7769, 106.7009],
  stops: [
    { id: 1, position: [10.7800, 106.7010], name: "Trạm 1" },
    { id: 2, position: [10.7850, 106.7050], name: "Trạm 2" }
  ],
  end: [10.8000, 106.7100],
  status: "chuabatdau"
}
```

### 2. Kiểm Tra Real-Time Position

**Console**:

```javascript
// Xem realTimeBusPos
realTimeBusPos
// Output:
{
  latitude: 10.7769,
  longitude: 106.7009,
  timestamp: "2025-12-09T10:30:00Z"
}
```

### 3. Kiểm Tra Listener

**Console**:

```javascript
// Xem socket
ParentTrackingService.socket;
// Xem event listeners
ParentTrackingService.socket?._events;
```

### 4. Force Trigger Events

**Console** (Nếu Có DevTools Backend):

```javascript
// Simulate socket event
ParentTrackingService.socket.emit("bus-location-1", {
  routeId: 1,
  latitude: 10.7769,
  longitude: 106.7009,
  timestamp: new Date().toISOString(),
});
```

---

## 📊 Test Results Template

```
===== Test Report =====
Date: 2025-12-09
Tester: [Your Name]

Test Case 1 (Polyline through stops): ✅ / ❌
Test Case 2 (Animation non-dangchay): ✅ / ❌
Test Case 3 (Real-time dangchay): ✅ / ❌
Test Case 4 (Status transition): ✅ / ❌
Test Case 5 (Socket connection): ✅ / ❌

Overall: ✅ PASS / ❌ FAIL

Issues Found:
- [...]

Notes:
- [...]
======================
```

---

## ✨ Expected Console Output

```
🔍 Tìm schedule 'dangchay' cho route 1...
🔄 Fetching route qua 5 điểm (attempt 1/4)...
✅ Route fetched: 523 points qua 5 waypoints
🎬 Bắt đầu animation xe di chuyển (status không phải dangchay)
📡 Thiết lập listener vị trí xe real-time cho route 1
✅ Đã subscribe event: bus-location-1
📍 Nhận vị trí xe real-time: {latitude, longitude, timestamp}
🔌 Đã unsubscribe event: bus-location-1
```

---

**Status**: Ready for Testing  
**Duration**: 15 minutes  
**Last Updated**: December 9, 2025
