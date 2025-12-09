# 🔧 DEBUG GUIDE: Thông Báo Không Hiển Thị

**Ngày cập nhật**: December 9, 2025  
**Vấn đề**: Thông báo sớm/trễ không hiển thị trên giao diện phụ huynh  
**Giải pháp**: Thêm logging chi tiết + tăng timeout từ 6 giây lên 10 giây

---

## ✅ Thay Đổi Được Thực Hiện

### 1. Tăng Thời Gian Hiển Thị

- **Cũ**: 6 giây
- **Mới**: 10 giây
- **File**: `frontend/src/pages/parent/Dashboard.jsx` (Line ~575)

### 2. Thêm Logging Chi Tiết

- Kiểm tra socket connection
- Kiểm tra listener registration
- Log dữ liệu nhận được
- Log state update
- Log auto-dismiss

---

## 🧪 Cách Debug

### Bước 1: Kiểm Tra Parent App Console

Mở DevTools → Console → Parent Dashboard Tab

**Tìm các log sau:**

```
✅ Parent tracking connected to server
📡 Parent Dashboard socket initialized
🚗 Registering trip-time-notification listener
🚗 [DEBUG] Socket object: [Socket object]
🚗 [DEBUG] Socket connected: true
🚗 [SUCCESS] Listener registered for trip-time-notification
```

**Nếu thấy những log này → Socket hoạt động OK**

---

### Bước 2: Kiểm Tra Driver App Console

Mở DevTools → Console → Driver Dashboard Tab

**Bắt đầu chuyến đi (Click "Bắt Đầu Chuyến Đi")**

**Tìm log:**

```
📢 Sent arrival time notification: {
  title: "🚀 Xe sẽ đến sớm!",
  message: "...",
  color: "#10b981"
}
```

**Nếu thấy log này → Driver đang gửi notification OK**

---

### Bước 3: Kiểm Tra Backend Console

Mở Terminal chạy Backend

**Tìm log:**

```
📢 [DRIVER] Trip time notification from driver ...
✅ [BACKEND] Trip time notification broadcast to all parents
```

**Nếu thấy log này → Backend relay OK**

---

### Bước 4: Quay Lại Parent App Console

**Tìm log quan trọng nhất:**

```
🚗 [HANDLER] Arrival time notification handler called with data: {...}
🚗 Arrival time notification received: [title] - [message]
🚗 [DEBUG] Color: #10b981 Status: Sớm hơn Emoji: 🚀
🚗 [DEBUG] Setting notification state: {...}
```

**Nếu thấy những log này → Notification nhận được OK**

---

## 🚨 Troubleshooting

### Vấn Đề 1: Socket Không Connected

**Logs**:

```
🚗 [DEBUG] Socket connected: false
🚗 [ERROR] Socket is null!
```

**Nguyên nhân**: Backend không chạy hoặc URL sai

**Giải pháp**:

1. Kiểm tra backend running: `npm start` (backend folder)
2. Kiểm tra port: http://localhost:8080
3. Kiểm tra frontend config có đúng port không

### Vấn Đề 2: Listener Không Nhận Được Data

**Logs**:

```
🚗 [SUCCESS] Listener registered for trip-time-notification
(nhưng không có log "Arrival time notification received")
```

**Nguyên nhân**: Driver không gửi notification hoặc data sai format

**Giải pháp**:

1. Kiểm tra Driver console có log "📢 Sent arrival time notification" không
2. Kiểm tra Backend console có relay log không
3. Nếu không → Driver chưa bắt đầu chuyến, hãy click "Bắt Đầu Chuyến Đi"

### Vấn Đề 3: Notification Nhận Được Nhưng Không Hiển Thị

**Logs**:

```
🚗 [DEBUG] Setting notification state: {...}
(nhưng không thấy badge trên UI)
```

**Nguyên nhân**: UI component không render hoặc CSS issue

**Giải pháp**:

1. Kiểm tra browser refresh xem load file mới không
2. Mở DevTools → Elements → Tìm div với `style={{position: "fixed", top: "20px", right: "20px"}}`
3. Nếu không thấy → Mở DevTools → Network → XHR → Kiểm tra có load file JS mới không

---

## 📊 Full Debug Checklist

### Socket Connection

- [ ] `🚗 [DEBUG] Socket object:` hiển thị Socket object
- [ ] `🚗 [DEBUG] Socket connected: true`
- [ ] Không có error về socket

### Listener Registration

- [ ] `🚗 Registering trip-time-notification listener`
- [ ] `🚗 [SUCCESS] Listener registered for trip-time-notification`
- [ ] Không có error về listener

### Data Receiving

- [ ] Driver: `📢 Sent arrival time notification`
- [ ] Backend: `📢 [DRIVER] Trip time notification from driver`
- [ ] Backend: `✅ [BACKEND] Trip time notification broadcast to all parents`
- [ ] Parent: `🚗 [HANDLER] Arrival time notification handler called`
- [ ] Parent: `🚗 Arrival time notification received`

### State Update

- [ ] `🚗 [DEBUG] Setting notification state:`
- [ ] Hiển thị notification object với data

### UI Display

- [ ] Notification badge hiển thị ở góc phải trên
- [ ] Màu sắc đúng (xanh/đỏ/cam/xanh dương)
- [ ] Emoji hiển thị
- [ ] Message hiển thị
- [ ] Timestamp hiển thị

### Auto-Dismiss

- [ ] Sau 10 giây: `⏰ Auto-dismissing arrival time notification`
- [ ] Notification biến mất

---

## 🔍 Cách Kiểm Tra DevTools Network

1. Mở DevTools → Network
2. Filter: WS (WebSocket)
3. Nhìn "Messages" tab
4. Tìm events: `trip-time-notification`
5. Kiểm tra data payload

---

## 💻 Console Commands

### Kiểm Tra Socket Connection

**Parent App Console:**

```javascript
ParentTrackingService.socket;
// Phải hiển thị Socket object, không phải null/undefined

ParentTrackingService.socket?.connected;
// Phải là true

ParentTrackingService.isConnected;
// Phải là true
```

### Kiểm Tra Listener

**Parent App Console:**

```javascript
// Sau khi page load xong, kiểm tra listener đã register chưa
// (Check logs trong console - "🚗 [SUCCESS] Listener registered")
```

### Gửi Notification Test Thủ Công

**Driver App Console:**

```javascript
// Nếu sendArrivalTimeNotification tồn tại
if (window.TrackingService?.socket) {
  window.TrackingService.socket.emit("trip-time-notification", {
    type: "arrival-time-early",
    title: "🚀 Xe sẽ đến sớm!",
    message: "2.5min → 2.2min | Chênh lệch: -0.3min (-12%)",
    color: "#10b981",
    status: "Sớm hơn",
    statusEmoji: "🚀",
    driverId: "TEST",
    driverName: "Tài xế Test",
    difference: -300,
    percentDiff: -12,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 📝 Expected Logs Sequence

Khi Driver bắt đầu chuyến:

```
=== DRIVER SIDE ===
📢 Sent arrival time notification: {...}

=== BACKEND ===
📢 [DRIVER] Trip time notification from driver ...
✅ [BACKEND] Trip time notification broadcast to all parents

=== PARENT SIDE ===
🚗 [HANDLER] Arrival time notification handler called with data: {...}
🚗 Arrival time notification received: [title] - [message]
🚗 [DEBUG] Color: #10b981 Status: Sớm hơn Emoji: 🚀
🚗 [DEBUG] Setting notification state: {...}

=== UI ===
(Badge xuất hiện ở góc phải trên)

=== AUTO-DISMISS AFTER 10s ===
⏰ Auto-dismissing arrival time notification
```

---

## 🎯 Kiểm Tra Nhanh (5 Phút)

1. Mở Parent app → DevTools Console
2. Tìm: `🚗 [DEBUG] Socket connected:`

   - Nếu `false` → Backend không chạy
   - Nếu `true` → OK, tiếp tục

3. Mở Driver app (tab khác)
4. Click "Bắt Đầu Chuyến Đi"
5. Xem Driver console: Có `📢 Sent arrival time notification`?

   - Nếu không → Driver app chưa bắt đầu chuyến
   - Nếu có → Tiếp tục

6. Quay lại Parent console
7. Tìm: `🚗 [HANDLER] Arrival time notification handler called`

   - Nếu không → Backend không relay
   - Nếu có → Tiếp tục

8. Kiểm tra UI:
   - Có badge ở góc phải trên không?
   - Màu đúng không?
   - Emoji đúng không?

---

## ✨ Kết Quả Expected

✅ **Nếu mọi thứ hoạt động:**

```
Parent App Console:
🚗 [SUCCESS] Listener registered for trip-time-notification
🚗 [HANDLER] Arrival time notification handler called with data: {...}
🚗 Arrival time notification received: 🚀 Xe sẽ đến sớm! - 2.5min → 2.2min
🚗 [DEBUG] Setting notification state: {...}

UI:
┌────────────────────────────────┐
│ 🚀 Xe sẽ đến sớm!              │ (Xanh #10b981)
│ 2.5min → 2.2min | ...          │
│ Trạng thái: Sớm hơn            │
│ 10:30:30                       │
└────────────────────────────────┘

(Hiển thị 10 giây, sau đó tự biến mất)
```

---

**Status**: ✅ Ready to Debug  
**Logs**: Comprehensive and detailed  
**Display Time**: 10 seconds  
**Next Step**: Follow debug checklist above
