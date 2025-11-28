/**
 * Schedule Handler - WebSocket events cho lịch trình
 * Khi admin phân công lịch, tài xế sẽ nhận được event real-time
 */

module.exports = (io, socket) => {
  /**
   * Event: Tài xế join room riêng của họ
   * Usage: socket.emit('join-driver-room', { driverId: 5 })
   */
  socket.on("join-driver-room", (data) => {
    const { driverId } = data;
    if (!driverId) {
      console.warn("⚠️ join-driver-room: Missing driverId");
      return;
    }

    const roomName = `driver-${driverId}`;
    socket.join(roomName);
    console.log(`✅ Driver ${driverId} joined room: ${roomName}`);
  });

  /**
   * Event: Admin join room để nhận schedule updates
   * Usage: socket.emit('join-admin-room')
   */
  socket.on("join-admin-room", (data) => {
    socket.join("admin-schedule");
    console.log(`✅ Admin joined room: admin-schedule`);
  });

  /**
   * Event: Tài xế rời room
   */
  socket.on("leave-driver-room", (data) => {
    const { driverId } = data;
    if (!driverId) return;

    const roomName = `driver-${driverId}`;
    socket.leave(roomName);
    console.log(`❌ Driver ${driverId} left room: ${roomName}`);
  });
};

/**
 * Helper function - Gửi event lịch mới cho tài xế
 * Được gọi từ service khi phân công lịch
 * @param {Object} io - Socket.io instance
 * @param {number} driverId - ID tài xế
 * @param {Object} scheduleData - Dữ liệu lịch trình mới
 * @param {string} eventName - Tên event (default: 'schedule-assigned')
 */
const notifyDriverNewSchedule = (
  io,
  driverId,
  scheduleData,
  eventName = "schedule-assigned"
) => {
  const roomName = `driver-${driverId}`;
  console.log(`[DEBUG] Emitting to room: ${roomName}, event: ${eventName}`);
  console.log(
    `[DEBUG] Clients in room:`,
    io.sockets.adapter.rooms.get(roomName)?.size || 0
  );

  io.to(roomName).emit(eventName, {
    success: true,
    message: "Bạn có lịch trình mới được phân công",
    data: scheduleData,
    timestamp: new Date().toISOString(),
  });

  console.log(`📢 Notified driver ${driverId}: ${eventName}`);
};

/**
 * Helper function - Gửi event cập nhật lịch cho tài xế
 * @param {Object} io - Socket.io instance
 * @param {number} driverId - ID tài xế
 * @param {Object} scheduleData - Dữ liệu lịch trình cập nhật
 */
const notifyDriverScheduleUpdate = (io, driverId, scheduleData) => {
  notifyDriverNewSchedule(io, driverId, scheduleData, "schedule-updated");
};

/**
 * Helper function - Gửi event xóa lịch cho tài xế
 * @param {Object} io - Socket.io instance
 * @param {number} driverId - ID tài xế
 * @param {number} scheduleId - ID lịch bị xóa
 */
const notifyDriverScheduleDeleted = (io, driverId, scheduleId) => {
  const roomName = `driver-${driverId}`;
  io.to(roomName).emit("schedule-deleted", {
    success: true,
    message: "Một lịch trình của bạn đã bị hủy",
    scheduleId: scheduleId,
    timestamp: new Date().toISOString(),
  });

  console.log(`🗑️ Notified driver ${driverId}: schedule ${scheduleId} deleted`);
};

module.exports.notifyDriverNewSchedule = notifyDriverNewSchedule;
module.exports.notifyDriverScheduleUpdate = notifyDriverScheduleUpdate;
module.exports.notifyDriverScheduleDeleted = notifyDriverScheduleDeleted;
