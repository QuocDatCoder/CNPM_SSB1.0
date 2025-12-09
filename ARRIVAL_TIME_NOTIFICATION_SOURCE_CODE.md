# Mã Nguồn: Thông Báo Thời Gian Đến (Arrival Time Notification)

## 📍 Vị Trí File

| File            | Đường Dẫn                                 |
| --------------- | ----------------------------------------- |
| Parent Frontend | `frontend/src/pages/parent/Dashboard.jsx` |
| Backend Socket  | `backend/src/sockets/tracking.handler.js` |
| Driver Frontend | `frontend/src/pages/driver/Dashboard.jsx` |

---

## 🔴 Backend: Handler (tracking.handler.js)

**Vị trí**: Lines 236-275

```javascript
/**
 * 📢 Socket event: Tài xế gửi thông báo dự kiến thời gian đến
 * Thông báo sớm/trễ với màu sắc tương ứng cho phụ huynh
 */
socket.on("trip-time-notification", (data) => {
  const {
    type,
    title,
    message,
    color,
    status,
    statusEmoji,
    routeName,
    routeId,
    scheduleId,
    driverId,
    driverName,
    difference,
    percentDiff,
    timestamp,
  } = data;

  console.log(
    `📢 [DRIVER] Trip time notification: ${statusEmoji} ${title} | ${message}`
  );

  // Relay thông báo tới tất cả phụ huynh trong phòng parent-tracking
  io.to("parent-tracking").emit("trip-time-notification", {
    type: type, // "arrival-time-early" | "arrival-time-late" | "arrival-time-normal"
    title: title,
    message: message,
    color: color, // Màu sắc: #10b981 (xanh), #ef4444 (đỏ), #f59e0b (cam), #3b82f6 (xanh dương)
    status: status,
    statusEmoji: statusEmoji,
    routeName: routeName,
    routeId: routeId,
    scheduleId: scheduleId,
    driverId: driverId,
    driverName: driverName,
    difference: difference, // milliseconds
    percentDiff: percentDiff, // percentage
    timestamp: timestamp,
  });

  console.log(`✅ [BACKEND] Trip time notification broadcast to all parents`);
});
```

---

## 🟢 Frontend Parent: State (Dashboard.jsx)

**Vị trí**: Lines 200-208

```javascript
// 🚗 Arrival time notification state (green=early, red=late)
const [arrivalTimeNotification, setArrivalTimeNotification] = useState(null);
const arrivalTimeNotificationTimeoutRef = useRef(null);
```

---

## 📡 Frontend Parent: Event Listener (Dashboard.jsx)

**Vị trí**: Lines 520-582

```javascript
// 🚗 Listen for arrival time notifications (green=early, red=late)
useEffect(() => {
  const handleArrivalTimeNotification = (data) => {
    const {
      type,
      title,
      message,
      color,
      status,
      emoji,
      driverId,
      driverName,
      difference,
      timestamp,
    } = data;

    console.log(
      `🚗 Arrival time notification received: ${title} - ${message}`,
      data
    );

    // Hiển thị arrival time notification với màu tương ứng
    setArrivalTimeNotification({
      title: title,
      message: message,
      color: color,
      status: status,
      emoji: emoji,
      driverName: driverName,
      difference: difference,
      timestamp: timestamp,
    });

    // Clear timeout cũ nếu có
    if (arrivalTimeNotificationTimeoutRef.current) {
      clearTimeout(arrivalTimeNotificationTimeoutRef.current);
    }

    // Set timeout mới để tự động ẩn sau 6 giây
    arrivalTimeNotificationTimeoutRef.current = setTimeout(() => {
      setArrivalTimeNotification(null);
    }, 6000);
  };

  console.log("🚗 Registering trip-time-notification listener");
  ParentTrackingService.socket?.on(
    "trip-time-notification",
    handleArrivalTimeNotification
  );

  return () => {
    console.log("🚗 Unregistering trip-time-notification listener");
    ParentTrackingService.socket?.off(
      "trip-time-notification",
      handleArrivalTimeNotification
    );
  };
}, []); // Empty dependency array - register listener once
```

---

## 🎨 Frontend Parent: UI Component (Dashboard.jsx)

**Vị trí**: Lines 1050-1100 (Trong return JSX)

```javascript
{
  /* 🚗 Arrival Time Notification Badge (Green=Early, Red=Late) */
}
{
  arrivalTimeNotification && (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: arrivalTimeNotification.color,
        color:
          arrivalTimeNotification.color === "#ef4444" ||
          arrivalTimeNotification.color === "#10b981"
            ? "white"
            : "#1f2937",
        padding: "16px 20px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: 9999,
        minWidth: "320px",
        animation: "slideIn 0.3s ease-out",
        border: `2px solid ${arrivalTimeNotification.color}`,
        marginTop:
          notification || approachingStopNotification ? "120px" : "0px",
        transition: "margin-top 0.3s ease-out",
      }}
    >
      <div style={{ fontWeight: "600", marginBottom: "4px" }}>
        {arrivalTimeNotification.emoji} {arrivalTimeNotification.title}
      </div>
      <div style={{ fontSize: "14px", marginBottom: "8px" }}>
        {arrivalTimeNotification.message}
      </div>
      <div style={{ fontSize: "12px", opacity: 0.85 }}>
        <strong>Trạng thái:</strong> {arrivalTimeNotification.status}
      </div>
      <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>
        {new Date(arrivalTimeNotification.timestamp).toLocaleTimeString(
          "vi-VN"
        )}
      </div>

      <style>{`
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `}</style>
    </div>
  );
}
```

---

## 🚗 Frontend Driver: Gửi Notification (Dashboard.jsx)

**Vị trí**: Lines ~1130-1195 (Hàm `sendArrivalTimeNotification`)

```javascript
const sendArrivalTimeNotification = (route, timeInfo) => {
  if (!timeInfo || !TrackingService.socket) {
    console.warn("❌ Cannot send notification - missing data or socket");
    return;
  }

  // Xác định loại thông báo dựa vào time difference
  let notificationType = "arrival-time-normal";
  let title = "⏱️ Xe sẽ đến đúng giờ";
  let notificationColor = "#3b82f6";

  if (timeInfo.difference < -5000) {
    notificationType = "arrival-time-early";
    title = "🚀 Xe sẽ đến sớm!";
    notificationColor = "#10b981";
  } else if (timeInfo.difference > 5000) {
    notificationType = "arrival-time-late";
    title = "🐢 Xe sẽ đến trễ!";
    notificationColor = "#ef4444";
  } else if (timeInfo.difference > 0) {
    notificationType = "arrival-time-slightly-late";
    title = "⏳ Xe sẽ đến chậm chút";
    notificationColor = "#f59e0b";
  }

  const notification = {
    type: notificationType,
    title: title,
    message: timeInfo.message,
    color: notificationColor,
    status: timeInfo.status,
    emoji: timeInfo.statusEmoji,
    driverId: currentDriver?.id || "N/A",
    driverName: currentDriver?.name || "Tài xế",
    difference: timeInfo.difference,
    percentDiff: timeInfo.percentDiff,
    timestamp: new Date().toISOString(),
  };

  // Gửi thông báo tới backend
  TrackingService.socket.emit("trip-time-notification", notification);
  console.log(`📢 Sent arrival time notification:`, notification);
};

// Gọi trong handleStartTrip():
const timeInfo = calculateTimeComparison(segments, path.length);
setTimeComparison(timeInfo);
sendArrivalTimeNotification(route, timeInfo); // 👈 Gửi notification
```

---

## 🔄 Luồng Dữ Liệu

### 1️⃣ Driver Gửi (Dashboard.jsx - Driver)

```
Tác vụ: handleStartTrip()
  ↓
calculateTimeComparison(segments, pathLength)
  ↓
Tạo object timeInfo:
{
  baseline: 2500,           // ms
  actual: 2200,             // ms
  difference: -300,         // ms
  percentDiff: -12,         // %
  status: "Sớm hơn",
  statusEmoji: "🚀",
  statusColor: "#10b981",
  message: "2.5min → 2.2min | Chênh lệch: -0.3min (-12%)",
  countSlow: 2,
  countFast: 3
}
  ↓
sendArrivalTimeNotification(route, timeInfo)
  ↓
Tạo notification object:
{
  type: "arrival-time-early",
  title: "🚀 Xe sẽ đến sớm!",
  message: "...",
  color: "#10b981",
  status: "Sớm hơn",
  emoji: "🚀",
  driverId: "...",
  driverName: "...",
  difference: -300,
  percentDiff: -12,
  timestamp: "..."
}
  ↓
socket.emit("trip-time-notification", notification)
```

### 2️⃣ Backend Nhận & Phát (tracking.handler.js)

```
Backend nhận event: "trip-time-notification"
  ↓
console.log("📢 [DRIVER] Trip time notification...")
  ↓
io.to("parent-tracking").emit("trip-time-notification", {
  ...notification_data
})
  ↓
console.log("✅ [BACKEND] Trip time notification broadcast to all parents")
```

### 3️⃣ Parent Nhận & Hiển Thị (Dashboard.jsx - Parent)

```
Listener: "trip-time-notification"
  ↓
handleArrivalTimeNotification(data)
  ↓
setArrivalTimeNotification({
  title: data.title,
  message: data.message,
  color: data.color,
  status: data.status,
  emoji: data.emoji,
  ...
})
  ↓
UI Component render với state arrivalTimeNotification
  ↓
UI Badge hiện ở góc phải trên cùng
  ↓
Sau 6 giây: setArrivalTimeNotification(null)
  ↓
Badge auto-dismiss
```

---

## 📝 Bảng Ánh Xạ (Mapping)

### Time Difference → Status

| Điều Kiện         | Status    | Emoji | Màu     | Thông Điệp          |
| ----------------- | --------- | ----- | ------- | ------------------- |
| diff < -5000ms    | Sớm hơn   | 🚀    | #10b981 | Xe sẽ đến sớm!      |
| diff > 5000ms     | Chậm hơn  | 🐢    | #ef4444 | Xe sẽ đến trễ!      |
| 0 < diff ≤ 5000ms | Chậm chút | ⏳    | #f59e0b | Xe sẽ đến chậm chút |
| diff = 0          | Đúng giờ  | ⏱️    | #3b82f6 | Xe sẽ đến đúng giờ  |

---

## 🧪 Test API

### Gửi Thông Báo Thủ Công (Trong Browser Console)

```javascript
// Mở console Driver app, chạy:
if (window.TrackingService?.socket) {
  window.TrackingService.socket.emit("trip-time-notification", {
    type: "arrival-time-early",
    title: "🚀 Xe sẽ đến sớm!",
    message: "2.5min → 2.2min | Chênh lệch: -0.3min (-12%)",
    color: "#10b981",
    status: "Sớm hơn",
    emoji: "🚀",
    driverId: "driver-1",
    driverName: "Tài xế Hải",
    difference: -300,
    percentDiff: -12,
    timestamp: new Date().toISOString(),
  });
  console.log("✅ Sent test notification");
}
```

### Kiểm Tra Socket Connection (Trong Browser Console)

```javascript
// Kiểm tra Parent socket
console.log("Socket:", window.ParentTrackingService?.socket);
console.log("Connected:", window.ParentTrackingService?.isConnected);

// Kiểm tra Driver socket
console.log("Socket:", window.TrackingService?.socket);
console.log("Connected:", window.TrackingService?.isConnected);
```

---

## 📊 Ví Dụ Dữ Liệu

### Ví Dụ 1: Sớm (Early)

```javascript
// Driver gửi:
{
  type: "arrival-time-early",
  title: "🚀 Xe sẽ đến sớm!",
  message: "2.5min → 2.2min | Chênh lệch: -0.3min (-12%)",
  color: "#10b981",
  status: "Sớm hơn",
  emoji: "🚀",
  driverId: "DRV001",
  driverName: "Tài xế Hải",
  difference: -300,
  percentDiff: -12,
  timestamp: "2025-12-09T10:30:00Z"
}

// Parent nhận và hiển thị:
// Badge xanh (#10b981) với emoji 🚀
```

### Ví Dụ 2: Trễ (Late)

```javascript
// Driver gửi:
{
  type: "arrival-time-late",
  title: "🐢 Xe sẽ đến trễ!",
  message: "2.5min → 2.8min | Chênh lệch: +0.3min (+12%)",
  color: "#ef4444",
  status: "Chậm hơn",
  emoji: "🐢",
  driverId: "DRV002",
  driverName: "Tài xế Minh",
  difference: 300,
  percentDiff: 12,
  timestamp: "2025-12-09T10:31:00Z"
}

// Parent nhận và hiển thị:
// Badge đỏ (#ef4444) với emoji 🐢
```

---

## 🔍 Console Logs Để Tìm

### Backend

```
📢 [DRIVER] Trip time notification: [emoji] [title] | [message]
✅ [BACKEND] Trip time notification broadcast to all parents
```

### Frontend Driver

```
📢 Sent arrival time notification: {...}
```

### Frontend Parent

```
🚗 Registering trip-time-notification listener
🚗 Arrival time notification received: [title] - [message]
```

---

## ✅ Verification Checklist

- [ ] Backend handler tồn tại ở tracking.handler.js
- [ ] Parent Dashboard có state arrivalTimeNotification
- [ ] Parent Dashboard có event listener
- [ ] Parent Dashboard có UI component
- [ ] Driver Dashboard có sendArrivalTimeNotification
- [ ] Driver Dashboard gọi hàm trong handleStartTrip
- [ ] Không có JavaScript errors
- [ ] Socket connection hoạt động
- [ ] Messages gửi nhận qua WebSocket
- [ ] Notification hiển thị với màu đúng

---

**File này cung cấp tất cả mã nguồn cần thiết để implement hệ thống thông báo thời gian đến cho phụ huynh.**
