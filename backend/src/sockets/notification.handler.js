// backend/src/sockets/notification.handler.js

/**
 * Xử lý sự kiện Socket cho Thông báo
 */
module.exports = (io, socket) => {
  // Lắng nghe sự kiện client (Driver/Parent) xin vào phòng nhận thông báo
  socket.on("join-notification-room", (data) => {
    const { userId } = data;
    if (userId) {
      // Đặt tên phòng theo User ID để gửi riêng cho từng người
      const roomName = `notify-user-${userId}`;
      socket.join(roomName);
      console.log(`🔔 User ${userId} joined notification room: ${roomName}`);
    }
  });
};

/**
 * Hàm Helper: Gửi thông báo Real-time (Được gọi từ Notification Service)
 * @param {Object} io - Socket IO instance
 * @param {number} userId - ID người nhận
 * @param {Object} payload - Dữ liệu thông báo (tiêu đề, nội dung...)
 */
module.exports.sendRealTimeNotification = (io, userId, payload) => {
  if (!io) return;
  
  const roomName = `notify-user-${userId}`;
  
  // Kiểm tra xem phòng có tồn tại không (Optional log)
  const room = io.sockets.adapter.rooms.get(roomName);
  
  // Gửi sự kiện 'new-notification' xuống Client
  io.to(roomName).emit("new-notification", {
    success: true,
    data: payload // Payload chứa: { subject, preview, type, ... }
  });
  
  console.log(`🚀 Sent notification to room ${roomName} (Clients: ${room ? room.size : 0})`);
};