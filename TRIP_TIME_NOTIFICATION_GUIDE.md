# 📢 Trip Time Notification - Hướng dẫn triển khai

## 🎯 Mô tả tính năng

Khi tài xế bắt đầu chuyến đi, hệ thống sẽ:

1. ✅ Tính toán dự kiến thời gian đến (so sánh với baseline 400ms/point)
2. 📢 Gửi thông báo real-time đến phụ huynh qua WebSocket
3. 🎨 Thông báo có màu sắc tương ứng (xanh=sớm, đỏ=chậm)

---

## 🏗️ Architecture

### Frontend (Dashboard.jsx - Đã triển khai)

```
Driver bắt đầu chuyến
    ↓
Tính toán tốc độ (random 3-6 segments)
    ↓
Tính toán thời gian vs baseline (400ms/point)
    ↓
Gửi event "trip-time-notification" qua socket
    ↓
Backend lắng nghe + phát lại cho Parents
```

### Backend (tracking.handler.js - Đã triển khai)

- Lắng nghe event: `trip-time-notification`
- Phát lại qua room: `parent-tracking`
- Emit event: `trip-time-notification`

### Parent App (Cần triển khai)

- Lắng nghe event: `trip-time-notification`
- Hiển thị thông báo với màu sắc tương ứng

---

## 📡 Socket Events

### Event: `trip-time-notification` (Driver → Backend → Parents)

**Driver gửi (Frontend):**

```javascript
TrackingService.socket.emit("trip-time-notification", {
  type: "arrival-time-early" | "arrival-time-late" | "arrival-time-normal",
  title: "🚀 Xe sẽ đến sớm!",
  message: "2.5min (baseline) → 2.2min (thực tế) | Chênh lệch: -0.3min (-12%)",
  color: "#10b981", // Xanh (sớm), Đỏ (chậm), Cam (chậm vừa), Xanh dương (đúng giờ)
  status: "Sớm hơn",
  statusEmoji: "⚡",
  routeName: "Lượt đi buổi sáng",
  routeId: 123,
  scheduleId: 123,
  driverId: "driver_001",
  driverName: "Nguyễn Văn A",
  difference: -300000, // milliseconds
  percentDiff: -12, // percentage
  timestamp: "2025-12-09T10:30:00Z",
});
```

**Backend phát lại cho Parents (Tracking.handler.js):**

```javascript
socket.on("trip-time-notification", (data) => {
  // Relay to all parents
  io.to("parent-tracking").emit("trip-time-notification", data);
});
```

**Parents lắng nghe (Parent App - Cần code):**

```javascript
socket.on("trip-time-notification", (notification) => {
  console.log("📢 Trip time notification:", notification);

  // Hiển thị thông báo
  showNotification({
    title: notification.title,
    message: notification.message,
    color: notification.color, // Dùng màu này để styling
    type: notification.type, // "arrival-time-early" | "arrival-time-late"
  });
});
```

---

## 🎨 Màu sắc theo loại thông báo

| Status   | Emoji | Title                      | Color                | Tình trạng     |
| -------- | ----- | -------------------------- | -------------------- | -------------- |
| Rất sớm  | 🚀    | Xe sẽ đến sớm!             | #10b981 (Xanh)       | Sớm > 5 giây   |
| Sớm      | ⚡    | Xe sẽ đến sớm hơn dự kiến  | #10b981 (Xanh)       | Sớm < 5 giây   |
| Đúng giờ | ⏱️    | Dự kiến thời gian đến      | #3b82f6 (Xanh dương) | Chênh lệch = 0 |
| Chậm     | ⏳    | Xe sẽ đến chậm hơn dự kiến | #f59e0b (Cam)        | Chậm < 5 giây  |
| Rất chậm | 🐢    | Xe sẽ đến chậm!            | #ef4444 (Đỏ)         | Chậm > 5 giây  |

---

## 📝 Ví dụ triển khai trong Parent App

### React Component Example

```jsx
// ParentNotificationCenter.jsx
import { useEffect, useState } from "react";
import { TrackingService } from "./services/tracking.service";

export default function ParentNotificationCenter() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Lắng nghe thông báo dự kiến thời gian đến
    TrackingService.socket?.on("trip-time-notification", (data) => {
      console.log("📢 Trip time notification received:", data);

      setNotification(data);

      // Tự động ẩn sau 5 giây
      setTimeout(() => setNotification(null), 5000);
    });

    return () => {
      TrackingService.socket?.off("trip-time-notification");
    };
  }, []);

  if (!notification) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "16px",
        backgroundColor: notification.color,
        color: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: 9999,
        maxWidth: "400px",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <h3 style={{ margin: "0 0 8px 0" }}>
        {notification.statusEmoji} {notification.title}
      </h3>
      <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
        {notification.message}
      </p>
      <small style={{ fontSize: "12px", opacity: 0.9 }}>
        Tài xế: {notification.driverName} | {notification.routeName}
      </small>
    </div>
  );
}
```

### Plain JavaScript Example

```javascript
// Lắng nghe thông báo
socket.on("trip-time-notification", (notification) => {
  console.log("📢 Trip time notification:", notification);

  // Tạo element thông báo
  const notificationEl = document.createElement("div");
  notificationEl.className = "notification";
  notificationEl.style.backgroundColor = notification.color;
  notificationEl.innerHTML = `
    <h3>${notification.statusEmoji} ${notification.title}</h3>
    <p>${notification.message}</p>
    <small>Tài xế: ${notification.driverName}</small>
  `;

  document.body.appendChild(notificationEl);

  // Ẩn sau 5 giây
  setTimeout(() => notificationEl.remove(), 5000);
});
```

---

## 🔍 Debugging

### Console logs Backend

```
📢 [DRIVER] Trip time notification: ⚡ Xe sẽ đến sớm hơn dự kiến | ...
✅ [BACKEND] Trip time notification broadcast to all parents
📊 [TRACKING] Nguyễn Văn A - Lượt đi buổi sáng - SỚM -12%
```

### Console logs Frontend (Parent App cần thêm)

```javascript
socket.on("trip-time-notification", (data) => {
  console.log("📢 Received:", data);
});
```

---

## ✅ Checklist triển khai

- [x] Frontend: Gửi event `trip-time-notification` từ Dashboard.jsx
- [x] Backend: Lắng nghe và phát lại event trong tracking.handler.js
- [ ] **Parent App: Lắng nghe event `trip-time-notification`**
- [ ] **Parent App: Hiển thị thông báo với UI đẹp**
- [ ] **Test: Kiểm tra thông báo đến phụ huynh**

---

## 🧪 Test Steps

1. **Backend**: Chạy backend server
2. **Frontend (Driver)**: Mở Driver Dashboard
3. **Parent App**: Mở Parent App (nếu có)
4. **Driver**: Bắt đầu chuyến đi
5. **Kiểm tra**:
   - ✅ Frontend: Console log hiển thị "📢 Sent arrival time notification"
   - ✅ Backend: Console log hiển thị "✅ [BACKEND] Trip time notification broadcast to all parents"
   - ✅ Parent: Nhận được thông báo với màu sắc tương ứng

---

## 🎯 Lưu ý

- Thông báo được gửi **1 lần duy nhất** khi bắt đầu chuyến
- Màu sắc tự động chọn dựa trên trạng thái thời gian
- Backend chỉ "relay" (phát lại) thông báo từ driver, không xử lý logic
- Phụ huynh cần lắng nghe `trip-time-notification` qua socket

---

## 📚 Liên quan

- Dashboard.jsx: Gửi event từ driver
- tracking.handler.js: Backend relay event
- Parent App: Lắng nghe và hiển thị (Cần triển khai)
