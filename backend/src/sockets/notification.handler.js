/**
 * Notification Socket Handler
 * Handles real-time notification events via WebSocket
 */

// Store active socket connections
const userSockets = {};

/**
 * Send real-time notification to specific user
 * @param {Object} io - Socket.io instance
 * @param {number} userId - Recipient user ID
 * @param {Object} notification - Notification data
 */
const sendRealTimeNotification = (io, userId, notification) => {
  const roomName = `user-${userId}`;
  io.to(roomName).emit("notification-received", {
    id: notification.id,
    title: notification.title || "Thông báo",
    message: notification.message,
    type: notification.type,
    is_read: notification.is_read || false,
    created_at: notification.created_at,
    timestamp: new Date().toISOString(),
  });
  console.log(`📤 Notification sent to user ${userId}`);
};

/**
 * Send alert notification to user
 * @param {Object} io - Socket.io instance
 * @param {number} userId - Recipient user ID
 * @param {Object} alert - Alert data
 */
const sendAlertNotification = (io, userId, alert) => {
  const roomName = `user-${userId}`;
  io.to(roomName).emit("alert-received", {
    id: alert.id,
    title: "🚨 " + (alert.title || "Cảnh báo hệ thống"),
    message: alert.message,
    alert_type: alert.alert_type,
    severity: alert.severity || "warning",
    created_at: alert.created_at,
    timestamp: new Date().toISOString(),
  });
  console.log(`🚨 Alert sent to user ${userId}: ${alert.message}`);
};

/**
 * Broadcast notification to multiple users
 * @param {Object} io - Socket.io instance
 * @param {Array} userIds - Array of recipient user IDs
 * @param {Object} notification - Notification data
 */
const broadcastNotification = (io, userIds, notification) => {
  userIds.forEach((userId) => {
    sendRealTimeNotification(io, userId, notification);
  });
};

module.exports = (io, socket) => {
  /**
   * Join user's notification room
   * Called when user connects to receive notifications
   */
  socket.on("join-notification-room", (data) => {
    const { userId } = data;
    const roomName = `user-${userId}`;

    socket.join(roomName);
    userSockets[userId] = socket.id;

    console.log(`✅ User ${userId} joined notification room: ${socket.id}`);
    socket.emit("notification-connected", {
      message: `Connected to notification room`,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Mark notification as read
   */
  socket.on("mark-notification-read", (data) => {
    const { notificationId } = data;
    console.log(`📖 Notification ${notificationId} marked as read`);
    // Database update is handled in the service
  });

  /**
   * Delete notification
   */
  socket.on("delete-notification", (data) => {
    const { notificationId } = data;
    console.log(`🗑️ Notification ${notificationId} deleted`);
    // Database update is handled in the service
  });

  /**
   * Leave notification room
   */
  socket.on("leave-notification-room", (data) => {
    const { userId } = data;
    const roomName = `user-${userId}`;

    socket.leave(roomName);
    delete userSockets[userId];

    console.log(`✅ User ${userId} left notification room`);
  });

  /**
   * Handle disconnect
   */
  socket.on("disconnect", () => {
    // Find and remove user from userSockets
    for (const [userId, socketId] of Object.entries(userSockets)) {
      if (socketId === socket.id) {
        delete userSockets[userId];
        console.log(`✅ User ${userId} disconnected from notifications`);
        break;
      }
    }
  });
};

// Export functions for use in services
module.exports.sendRealTimeNotification = sendRealTimeNotification;
module.exports.sendAlertNotification = sendAlertNotification;
module.exports.broadcastNotification = broadcastNotification;
