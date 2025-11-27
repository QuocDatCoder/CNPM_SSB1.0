//nho npm install soket.io-client

// Script giả lập phụ huynh/admin lắng nghe socket từ backend

const { io } = require("socket.io-client");

// Kết nối tới backend socket server
const socket = io("http://localhost:8080");

// Khi kết nối thành công
socket.on("connect", () => {
  console.log("✅ Listener connected to server:", socket.id);
});

// Nhận sự kiện vị trí xe buýt
socket.on("busLocationUpdated", (data) => {
  console.log("🚌 Bus location received:", data);
});

// Nhận sự kiện trạng thái học sinh
socket.on("studentStatusUpdated", (data) => {
  console.log("👩‍🎓 Student status received:", data);
});
