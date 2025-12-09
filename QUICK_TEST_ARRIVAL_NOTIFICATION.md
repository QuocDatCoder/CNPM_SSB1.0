# ⚡ QUICK TEST: Thông Báo Sớm/Trễ (10 Giây)

**Ngày**: December 9, 2025  
**Vấn đề**: Thông báo không hiển thị  
**Giải pháp**: Logging + 10 giây hiển thị  
**Thời gian test**: 3 phút

---

## 🚀 Bước 1: Chắc Chắn Backend Chạy

```bash
# Terminal 1: Backend
cd backend
npm start

# Xem log:
# ✅ Server listening on port 8080
```

---

## 🎨 Bước 2: Chắc Chắn Frontend Chạy

```bash
# Terminal 2: Frontend
cd frontend
npm run dev

# Xem log:
# ✅ VITE ... ready in ... ms
# ✅ Local: http://localhost:5173
```

---

## 👨‍💼 Bước 3: Mở Parent App

1. Browser tab 1: http://localhost:5173/parent
2. Mở DevTools: F12
3. Tab "Console"

**Tìm log:**

```
🚗 [DEBUG] Socket connected: true
🚗 [SUCCESS] Listener registered for trip-time-notification
```

**Nếu thấy:**  
✅ Parent app sẵn sàng

**Nếu KHÔNG thấy:**  
❌ Backend chưa chạy hoặc socket lỗi

---

## 👨‍🚌 Bước 4: Mở Driver App

1. Browser tab 2: http://localhost:5173/driver
2. DevTools: F12 → Console

---

## 🚌 Bước 5: Bắt Đầu Chuyến Đi

**Driver App:**

1. Tìm button "Bắt Đầu Chuyến Đi"
2. Click button đó

**Xem Driver Console:**

```
📢 Sent arrival time notification: {
  title: "🚀 Xe sẽ đến sớm!",
  message: "...",
  color: "#10b981"
}
```

**Nếu thấy:**  
✅ Driver gửi notification OK

**Nếu KHÔNG thấy:**  
❌ Kiểm tra lại step 4

---

## 👨‍👩‍👧 Bước 6: Kiểm Tra Parent App

**Quay lại Parent Console:**

```
🚗 [HANDLER] Arrival time notification handler called with data: {...}
🚗 Arrival time notification received: 🚀 Xe sẽ đến sớm! - 2.5min → 2.2min
🚗 [DEBUG] Color: #10b981 Status: Sớm hơn Emoji: 🚀
🚗 [DEBUG] Setting notification state: {...}
```

**Nếu thấy những log này:**  
✅ Notification nhận được OK

**Kiểm Tra UI:**

- Nhìn góc **phải trên cùng** của Parent page
- Có **badge xanh** (`#10b981`) không?
- Có **emoji 🚀** không?
- Có **tiêu đề "Xe sẽ đến sớm!"** không?
- Có **thời gian so sánh** không?

**Nếu thấy badge:**  
✅ **SUCCESS! Notification hoạt động!**

**Nếu KHÔNG thấy badge:**

- Kiểm tra CSS/styling
- Refresh page (Ctrl+F5)
- Xem DevTools → Elements → Tìm div với `position: fixed`

---

## ⏱️ Bước 7: Chờ Auto-Dismiss

**Chờ 10 giây**

**Xem Parent Console:**

```
⏰ Auto-dismissing arrival time notification
```

**Xem UI:**

- Badge biến mất sau 10 giây?

**Nếu vậy:**  
✅ **Auto-dismiss hoạt động!**

---

## 📊 Kết Quả Expected

### Timeline:

```
t=0s:  Driver click "Bắt Đầu Chuyến Đi"
t=0s:  Driver console log: "📢 Sent arrival time notification"
t=0s:  Backend console log: "📢 [DRIVER] Trip time notification..."
t=0s:  Backend console log: "✅ [BACKEND] Trip time notification broadcast"
t=0.5s: Parent console log: "🚗 [HANDLER] Arrival time notification handler called"
t=0.5s: Parent console log: "🚗 Arrival time notification received"
t=0.5s: Parent UI: Badge xuất hiện ở góc phải trên
t=10s: Parent console log: "⏰ Auto-dismissing arrival time notification"
t=10.5s: Parent UI: Badge biến mất
```

### Color Reference:

```
Sớm (Early):     🟢 Xanh #10b981  + Emoji 🚀
Trễ (Late):      🔴 Đỏ #ef4444    + Emoji 🐢
Chậm chút:       🟠 Cam #f59e0b   + Emoji ⏳
Đúng giờ:        🔵 Xanh #3b82f6  + Emoji ⏱️
```

---

## 🐛 Nếu Không Thấy Thông Báo

### Kiểm Tra 1: Socket Connection

```javascript
// Parent Console:
ParentTrackingService.socket?.connected;
// Phải là: true
```

### Kiểm Tra 2: Driver Console

Có log `📢 Sent arrival time notification` không?

- Nếu KHÔNG → Click "Bắt Đầu Chuyến Đi" lại

### Kiểm Tra 3: Backend Console

Có log `📢 [DRIVER] Trip time notification` không?

- Nếu KHÔNG → Backend chưa chạy

### Kiểm Tra 4: Browser DevTools Network

1. Tab Network
2. Filter: WS (WebSocket)
3. Click "Messages"
4. Tìm event `trip-time-notification`
5. Kiểm tra data có không?

---

## ✅ Success Checklist

- [ ] Backend running (port 8080)
- [ ] Frontend running (port 5173)
- [ ] Parent app console: `Socket connected: true`
- [ ] Parent app console: `Listener registered`
- [ ] Driver click "Bắt Đầu Chuyến Đi"
- [ ] Driver console: `📢 Sent arrival time notification`
- [ ] Backend console: `📢 [DRIVER] Trip time notification`
- [ ] Backend console: `✅ [BACKEND] Trip time notification broadcast`
- [ ] Parent console: `🚗 [HANDLER] Arrival time notification handler called`
- [ ] Parent UI: Badge hiển thị ở góc phải trên
- [ ] Parent UI: Màu sắc đúng (xanh/đỏ/cam/xanh dương)
- [ ] Parent UI: Emoji đúng
- [ ] Parent UI: Tự biến mất sau 10 giây

---

## 📝 Ghi Chú

- **Display time**: 10 giây (tăng từ 6 giây cũ)
- **Auto-dismiss**: Tự động (không cần bấm)
- **Multiple notifications**: Xếp chồng lên nhau (+120px margin)
- **Logging**: Chi tiết để debug

---

## 🎯 Summary

| Bước | Action          | Expected Result     |
| ---- | --------------- | ------------------- |
| 1    | Chạy backend    | Port 8080 listening |
| 2    | Chạy frontend   | Port 5173 ready     |
| 3    | Mở parent app   | Socket connected    |
| 4    | Mở driver app   | Sẵn sàng            |
| 5    | Click "Bắt Đầu" | Gửi notification    |
| 6    | Xem parent UI   | Badge xuất hiện     |
| 7    | Chờ 10 giây     | Badge biến mất      |

✅ **PASS** = Thông báo hoạt động hoàn hảo!

---

**Duration**: 3 phút  
**Difficulty**: Easy  
**Status**: ✅ Ready to Test
