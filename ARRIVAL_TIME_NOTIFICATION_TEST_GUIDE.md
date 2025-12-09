# Hướng Dẫn Kiểm Tra Thông Báo Thời Gian Đến (Arrival Time Notification)

## 📋 Tổng Quan Hệ Thống

Hệ thống thông báo thời gian đến cho phụ huynh hoạt động như sau:

1. **Driver** bắt đầu chuyến đi
2. **Driver App** tính toán thời gian so với baseline (400ms/điểm)
3. **Driver App** gửi thông báo qua socket: `trip-time-notification`
4. **Backend** nhận và phát lại cho tất cả phụ huynh
5. **Parent App** hiển thị thông báo với màu tương ứng

## 🎨 Bảng Màu Thông Báo

| Trạng Thái     | Màu                     | Emoji | Ý Nghĩa                   |
| -------------- | ----------------------- | ----- | ------------------------- |
| Sớm hơn nhiều  | 🟢 #10b981 (Xanh)       | 🚀    | Xe sẽ đến sớm hơn >5 giây |
| Chậm hơn nhiều | 🔴 #ef4444 (Đỏ)         | 🐢    | Xe sẽ đến trễ hơn >5 giây |
| Chậm hơn chút  | 🟠 #f59e0b (Cam)        | ⏳    | Xe sẽ đến trễ 0-5 giây    |
| Đúng giờ       | 🔵 #3b82f6 (Xanh dương) | ⏱️    | Xe sẽ đến đúng thời gian  |

## 🧪 Hướng Dẫn Kiểm Tra

### Bước 1: Chuẩn Bị

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend (Driver)
cd frontend
npm run dev

# Terminal 3: Parent App (nếu có)
# Hoặc mở browser tab khác với tài khoản phụ huynh
```

### Bước 2: Kiểm Tra Backend (tracking.handler.js)

Mở DevTools console của backend (nếu chạy bằng Node):

- Khi Driver gửi `trip-time-notification`
- Bạn sẽ thấy: **`📢 [DRIVER] Trip time notification from driver ...`**
- Và: **`✅ [BACKEND] Trip time notification broadcast to all parents`**

### Bước 3: Kiểm Tra Frontend Driver (Dashboard.jsx)

Mở DevTools → Console của Driver App:

- Tìm log: **`📢 Sent arrival time notification`**
- Kiểm tra object notification được gửi có các trường:
  ```
  {
    type: "arrival-time-early|late|normal",
    title: "🚀 Xe sẽ đến sớm!",
    message: "2.5min → 2.2min | Chênh lệch: -0.3min (-12%)",
    color: "#10b981",
    status: "Sớm hơn",
    emoji: "🚀",
    driverId: "...",
    driverName: "...",
    timestamp: "..."
  }
  ```

### Bước 4: Kiểm Tra Frontend Parent (Parent Dashboard.jsx)

Mở DevTools → Console của Parent App:

#### 4.1 Kiểm Tra Socket Connection

- Nhìn log: **`📡 Parent Dashboard socket initialized`**
- Hoặc: **`✅ Parent tracking connected to server`**

#### 4.2 Kiểm Tra Listener Đăng Ký

- Nhìn log: **`🚗 Registering trip-time-notification listener`**

#### 4.3 Kiểm Tra Notification Nhận Được

- Nhìn log: **`🚗 Arrival time notification received: [title] - [message]`**
- Và object data được nhận

### Bước 5: Kiểm Tra UI Hiển Thị

#### 5.1 Thông Báo Xuất Hiện Ở Vị Trí Đúng

- [ ] Thông báo hiển thị góc phải trên cùng
- [ ] Có animation slide-in từ phải sang trái
- [ ] Có border màu theo trạng thái

#### 5.2 Nội Dung Thông Báo Đúng

- [ ] Emoji hiển thị đúng (🚀, 🐢, ⏳, ⏱️)
- [ ] Title hiển thị đúng (ví dụ: "Xe sẽ đến sớm!")
- [ ] Message hiển thị thời gian so sánh (ví dụ: "2.5min → 2.2min | Chênh lệch: -0.3min (-12%)")
- [ ] Status hiển thị đúng (Sớm hơn, Chậm hơn, Đúng giờ)

#### 5.3 Màu Sắc Đúng

- [ ] Xanh (#10b981) khi sớm
- [ ] Đỏ (#ef4444) khi trễ >5 giây
- [ ] Cam (#f59e0b) khi trễ <5 giây
- [ ] Xanh dương (#3b82f6) khi đúng giờ

#### 5.4 Auto-Dismiss

- [ ] Thông báo tự động biến mất sau 6 giây
- [ ] Không cần click để đóng

#### 5.5 Xếp Chồng Đúng Cách

- [ ] Nếu có nhiều thông báo cùng lúc:
  - Thông báo status (xanh) ở trên
  - Thông báo approaching-stop (vàng) ở giữa (+100px margin-top)
  - Thông báo arrival-time ở dưới (+120px margin-top)

## 🐛 Debug Checklist

### Nếu Không Thấy Thông Báo

#### 1. Kiểm Tra Backend Handler

```bash
# Mở file: backend/src/sockets/tracking.handler.js
# Tìm handler: socket.on("trip-time-notification", (data) => { ... })
# Nếu không có → Thêm handler (xem TRIP_TIME_NOTIFICATION_GUIDE.md)
```

#### 2. Kiểm Tra Frontend Socket Connection

```javascript
// Trong DevTools Console của Parent App:
console.log(ParentTrackingService.socket);
// Phải hiển thị object socket, không phải null

console.log(ParentTrackingService.isConnected);
// Phải là true
```

#### 3. Kiểm Tra Event Listener Đã Đăng Ký

```javascript
// Trong DevTools Console:
// Chạy lệnh sau trước khi parent vào trang:
localStorage.debug = "*";
// Rồi reload trang và xem logs
```

#### 4. Kiểm Tra Driver Đang Gửi Notification

- Trong DevTools Driver App, tìm log: **`📢 Sent arrival time notification`**
- Nếu không có → Driver app chưa bắt đầu chuyến đi

#### 5. Kiểm Tra Network Tab

- Mở DevTools → Network → WS (WebSocket)
- Kiểm tra socket events được gửi/nhận:
  - `trip-time-notification` (từ driver)
  - Các socket events khác để xác nhận kết nối đang hoạt động

### Nếu Thông Báo Hiển Thị Sai

#### 1. Kiểm Tra Màu Sắc Sai

- Xem logs để kiểm tra `color` trong object notification
- So sánh với bảng màu ở trên
- Kiểm tra `difference` và logic xác định màu trong `Dashboard.jsx` (Driver)

#### 2. Kiểm Tra Emoji Sai

- Xem object notification trong logs
- Kiểm tra `emoji` field
- So sánh với bảng màu (status → emoji mapping)

#### 3. Kiểm Tra Message Sai

- Xem object notification trong logs
- Kiểm tra `message` và `status` fields
- So sánh logic tính toán trong `calculateTimeComparison()` (Driver)

## 📊 Ví Dụ Test Cases

### Test Case 1: Bus Sớm (Early)

```
1. Driver bắt đầu chuyến
2. System tính: actual_time = 2200ms, baseline_time = 2500ms
3. difference = -300ms (< -5000ms)
4. Status = "Sớm hơn", Màu = 🟢 #10b981, Emoji = 🚀
5. Message = "2.5min → 2.2min | Chênh lệch: -0.3min (-12%)"
✅ Expected: Xanh badge với emoji 🚀
```

### Test Case 2: Bus Trễ (Late >5 giây)

```
1. Driver bắt đầu chuyến
2. System tính: actual_time = 2800ms, baseline_time = 2500ms
3. difference = 300ms (> 5000ms)
4. Status = "Chậm hơn", Màu = 🔴 #ef4444, Emoji = 🐢
5. Message = "2.5min → 2.8min | Chênh lệch: +0.3min (+12%)"
✅ Expected: Đỏ badge với emoji 🐢
```

### Test Case 3: Bus Trễ Chút (Late <5 giây)

```
1. Driver bắt đầu chuyến
2. System tính: actual_time = 2550ms, baseline_time = 2500ms
3. difference = 50ms (0 < 50 < 5000)
4. Status = "Chậm hơn chút", Màu = 🟠 #f59e0b, Emoji = ⏳
5. Message = "2.5min → 2.55min | Chênh lệch: +0.05min (+2%)"
✅ Expected: Cam badge với emoji ⏳
```

### Test Case 4: Bus Đúng Giờ (On-time)

```
1. Driver bắt đầu chuyến
2. System tính: actual_time = 2500ms, baseline_time = 2500ms
3. difference = 0ms
4. Status = "Đúng giờ", Màu = 🔵 #3b82f6, Emoji = ⏱️
5. Message = "2.5min → 2.5min | Chênh lệch: 0ms (0%)"
✅ Expected: Xanh dương badge với emoji ⏱️
```

## 🔍 Console Logs Cần Tìm

### Frontend Parent App

```
✅ Parent tracking connected to server
🚗 Registering trip-time-notification listener
🚗 Arrival time notification received: [title] - [message]
🚗 Unregistering trip-time-notification listener (when unmounting)
```

### Backend

```
📢 [DRIVER] Trip time notification from driver [driverId]
✅ [BACKEND] Trip time notification broadcast to all parents
```

### Frontend Driver App

```
📢 Sent arrival time notification
(Nằm trong logs của handleStartTrip)
```

## ✅ Checklist Hoàn Tất

- [ ] Backend có handler cho `trip-time-notification`
- [ ] Parent App socket connection hoạt động
- [ ] Parent App listener cho `trip-time-notification` đã đăng ký
- [ ] Driver App gửi notification khi bắt đầu chuyến
- [ ] Thông báo xuất hiện trong UI Parent App
- [ ] Màu sắc đúng theo trạng thái
- [ ] Emoji đúng theo trạng thái
- [ ] Message hiển thị đúng thông tin
- [ ] Thông báo auto-dismiss sau 6 giây
- [ ] Không có lỗi JavaScript trong console

## 📝 Ghi Chú

- Thông báo sẽ **chỉ hiển thị cho phụ huynh** khi parent app socket listener sẵn sàng
- Nếu parent app không listening, backend vẫn sẽ broadcast nhưng **không có người nhận**
- Kiểm tra Browser DevTools Network tab để xác nhận socket message được gửi

## 🆘 Liên Hệ Support

Nếu vẫn gặp vấn đề:

1. Kiểm tra tất cả logs console
2. Kiểm tra Backend running trên port 8080
3. Kiểm tra Frontend running trên port 5173
4. Kiểm tra không có lỗi CORS trong console
5. Xem file implementation trong `TRIP_TIME_NOTIFICATION_GUIDE.md`
