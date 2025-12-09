# 🚀 QUICK START: Kiểm Tra Thông Báo Phụ Huynh

## ⚡ Nhanh Chóng (5 Phút)

### Step 1: Chạy Hệ Thống

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend (Driver)
cd frontend && npm run dev

# Terminal 3: Parent App (nếu riêng) hoặc dùng tab browser
```

### Step 2: Kiểm Tra Parent App

```javascript
// Mở DevTools Console → Parent App Tab
// Tìm:
console.log("✅ Parent tracking connected to server");
console.log("🚗 Registering trip-time-notification listener");
```

### Step 3: Bắt Đầu Chuyến Đi (Driver App)

- Click "Bắt Đầu Chuyến Đi"
- Xem Driver console: `📢 Sent arrival time notification`

### Step 4: Xem Thông Báo (Parent App)

- **Góc phải trên cùng** sẽ hiện thông báo
- Kiểm tra màu sắc, emoji, nội dung
- Tự động biến mất sau 6 giây

---

## 🎨 Màu Sắc Expected

| Trạng Thái   | Màu    | Emoji | Location           |
| ------------ | ------ | ----- | ------------------ |
| 🟢 Sớm       | Green  | 🚀    | Top-right          |
| 🔴 Trễ       | Red    | 🐢    | Top-right (+120px) |
| 🟠 Chậm chút | Orange | ⏳    | Top-right (+120px) |
| 🔵 Đúng giờ  | Blue   | ⏱️    | Top-right (+120px) |

---

## 📱 Test Cases (3 Trường Hợp)

### Test 1: Sớm (Early)

```
Expected:
- Màu xanh (#10b981)
- Emoji: 🚀
- Title: "Xe sẽ đến sớm!"
- Message: "... | Chênh lệch: -... (-...%)"
```

### Test 2: Trễ (Late)

```
Expected:
- Màu đỏ (#ef4444)
- Emoji: 🐢
- Title: "Xe sẽ đến trễ!"
- Message: "... | Chênh lệch: +... (+...%)"
```

### Test 3: Đúng Giờ (On-time)

```
Expected:
- Màu xanh dương (#3b82f6)
- Emoji: ⏱️
- Title: "Xe sẽ đến đúng giờ"
- Message: "... | Chênh lệch: 0ms (0%)"
```

---

## 🐛 Debug Quick Tips

| Vấn Đề                       | Kiểm Tra                                  | Fix                         |
| ---------------------------- | ----------------------------------------- | --------------------------- |
| Không thấy thông báo         | DevTools Console: `socket` object exists? | Kiểm tra backend running    |
| Thông báo không auto-dismiss | Event listener đã đăng ký?                | Refresh page, kiểm tra logs |
| Màu sắc sai                  | Check `color` trong console log           | Kiểm tra driver app         |
| Emoji không hiển thị         | Check `emoji` field trong data            | Kiểm tra data gửi từ driver |

---

## 📊 Console Logs Cần Tìm

```javascript
// Parent App Console:
✅ Parent tracking connected to server
📡 Parent Dashboard socket initialized
🚗 Registering trip-time-notification listener
🚗 Arrival time notification received: [title] - [message]

// Driver App Console:
📢 Sent arrival time notification
```

---

## ✅ Verification

- [ ] Backend có log `📢 [DRIVER] Trip time notification`?
- [ ] Backend có log `✅ [BACKEND] Trip time notification broadcast`?
- [ ] Parent console có log `🚗 Arrival time notification received`?
- [ ] Thông báo hiển thị ở **góc phải trên cùng**?
- [ ] Màu sắc **đúng** theo trạng thái?
- [ ] Emoji **hiển thị đúng**?
- [ ] Message **chứa thông tin thời gian**?
- [ ] Tự động **biến mất sau 6s**?

---

## 🚨 Nếu Vẫn Không Hoạt Động

1. **Kiểm tra Backend Running**: `http://localhost:8080`

   - Mở another tab → `http://localhost:8080`
   - Nếu không connect → Backend chưa chạy

2. **Kiểm tra Socket Connection**:

   ```javascript
   // DevTools Parent App:
   console.log(window.ParentTrackingService?.socket?.connected);
   // Phải là: true
   ```

3. **Kiểm tra Event Listener**:

   ```javascript
   // DevTools Parent App:
   // Tìm trong console logs:
   // "🚗 Registering trip-time-notification listener"
   // Nếu không có → Page chưa load xong
   ```

4. **Kiểm tra Driver Gửi Notification**:
   ```javascript
   // DevTools Driver App:
   // Tìm: "📢 Sent arrival time notification"
   // Nếu không có → Chưa bắt đầu chuyến
   ```

---

## 📝 Files Tham Khảo

```
📁 CNPM_SSB1.0/
├── PARENT_NOTIFICATION_IMPLEMENTATION_COMPLETE.md  ← Status
├── ARRIVAL_TIME_NOTIFICATION_TEST_GUIDE.md        ← Chi tiết test
├── ARRIVAL_TIME_NOTIFICATION_SOURCE_CODE.md       ← Mã nguồn
├── TRIP_TIME_NOTIFICATION_GUIDE.md                ← Kỹ thuật
│
├── frontend/src/pages/parent/Dashboard.jsx        ← ✅ UI & Listener
├── backend/src/sockets/tracking.handler.js        ← ✅ Handler
└── frontend/src/pages/driver/Dashboard.jsx        ← ✅ Sender
```

---

## 💻 Lệnh Nhanh

```bash
# Kiểm tra backend port
netstat -an | find ":8080"

# Kiểm tra frontend port
netstat -an | find ":5173"

# Kill process nếu cần
# (Windows)
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

---

## 🎯 Expected Result

Khi driver bắt đầu chuyến:

```
DRIVER APP CONSOLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 Sent arrival time notification: {
  type: "arrival-time-early",
  title: "🚀 Xe sẽ đến sớm!",
  message: "2.5min → 2.2min | Chênh lệch: -0.3min (-12%)",
  color: "#10b981",
  ...
}

BACKEND CONSOLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 [DRIVER] Trip time notification: 🚀 Xe sẽ đến sớm! | 2.5min → 2.2min
✅ [BACKEND] Trip time notification broadcast to all parents

PARENT APP CONSOLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚗 Arrival time notification received: 🚀 Xe sẽ đến sớm! - 2.5min → 2.2min

PARENT APP UI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────────────┐
│ 🚀 Xe sẽ đến sớm!               │ ← Xanh (#10b981)
│                                 │
│ 2.5min → 2.2min |...            │
│ Chênh lệch: -0.3min (-12%)       │
│                                 │
│ Trạng thái: Sớm hơn              │
│ 10:30:00 AM                      │
└─────────────────────────────────┘
     ↑ Góc phải trên cùng
```

---

## 🏁 Success!

✅ Nếu thấy được tất cả như trên → **Hệ thống hoạt động hoàn hảo!**

---

**Duration**: 5 minutes  
**Difficulty**: Easy  
**Status**: ✅ Ready to Test
