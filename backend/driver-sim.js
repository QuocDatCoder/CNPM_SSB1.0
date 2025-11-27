// nho npm install soket.io-client
// Script giả lập tài xế gửi vị trí xe buýt liên tục

const { io } = require("socket.io-client");

// Kết nối tới backend socket server
const socket = io("http://localhost:8080");

// Khi kết nối thành công
socket.on("connect", () => {
  console.log("✅ Driver connected to server:", socket.id);

  let lat = 10.762622;
  let lng = 106.660172;
  let busId = 1;

  // Gửi vị trí xe mỗi 5 giây
  setInterval(() => {
    lat += (Math.random() - 0.5) * 0.001; // giả lập di chuyển ngẫu nhiên
    lng += (Math.random() - 0.5) * 0.001;

    const data = { busId, lat, lng };
    console.log("📡 Sending driverLocationUpdate:", data);

    socket.emit("driverLocationUpdate", data);
  }, 5000);
});

// Nhận phản hồi từ server khi có sự kiện busLocationUpdated
socket.on("busLocationUpdated", (data) => {
  console.log("🚌 Bus location broadcasted:", data);
});

// Nhận phản hồi khi có sự kiện studentStatusUpdated
socket.on("studentStatusUpdated", (data) => {
  console.log("👩‍🎓 Student status broadcasted:", data);
});
