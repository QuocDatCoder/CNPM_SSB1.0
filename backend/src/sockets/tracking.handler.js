const { stopBusSimulator } = require("../services/bus-simulator.service");

module.exports = (io, socket) => {
  /**
   * Admin/Parent join tracking room để nhận updates vị trí xe bus
   */
  socket.on("join-tracking-room", (data) => {
    const { role, userId } = data; // role: 'admin' | 'parent' | 'driver'

    let roomName = "";
    if (role === "admin") {
      roomName = "admin-tracking";
    } else if (role === "parent") {
      roomName = "parent-tracking";
    } else if (role === "driver") {
      roomName = `driver-${userId}`;
    }

    if (roomName) {
      socket.join(roomName);
      console.log(`✅ User joined ${roomName}: ${socket.id}`);
      socket.emit("tracking-connected", {
        message: `Connected to ${roomName}`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Parent join parent tracking room
   */
  socket.on("join-parent-tracking", (data) => {
    socket.join("parent-tracking");
    console.log(`✅ Parent joined parent-tracking room: ${socket.id}`);
    socket.emit("parent-tracking-connected", {
      message: "Connected to parent tracking",
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Rời tracking room
   */
  socket.on("leave-tracking-room", (data) => {
    const { role, userId } = data;

    let roomName = "";
    if (role === "admin") {
      roomName = "admin-tracking";
    } else if (role === "parent") {
      roomName = "parent-tracking";
    } else if (role === "driver") {
      roomName = `driver-${userId}`;
    }

    if (roomName) {
      socket.leave(roomName);
      console.log(`❌ User left ${roomName}: ${socket.id}`);
    }
  });

  /**
   * Parent leave tracking room
   */
  socket.on("leave-parent-tracking", (data) => {
    socket.leave("parent-tracking");
    console.log(`❌ Parent left parent-tracking room: ${socket.id}`);
  });

  /**
   * Tài xế gửi vị trí xe bus thực tế lên backend
   * Data: { latitude, longitude, scheduleId, driverId, timestamp }
   */
  socket.on("driver-location-update", (data) => {
    console.log("📍 Driver location update received:", data);

    // Validate data
    if (!data.latitude || !data.longitude || !data.scheduleId) {
      console.warn("Invalid location data:", data);
      return;
    }

    // 🚨 CRITICAL FIX: Stop simulator when real driver sends location
    // Prevents duplicate location updates from both simulator and real driver
    if (data.driverId && data.scheduleId) {
      try {
        stopBusSimulator(data.scheduleId);
        console.log(
          `⏹️ Simulator stopped for schedule ${data.scheduleId} - real driver sending location`
        );
      } catch (error) {
        console.error(`Error stopping simulator: ${error.message}`);
      }
    }

    // Phát lại cho tất cả phụ huynh & admin trong parent-tracking room
    io.to("parent-tracking").emit("bus-location-update", {
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
      },
      scheduleId: data.scheduleId,
      driverId: data.driverId,
      timestamp: data.timestamp,
      progressPercentage: data.progressPercentage || 0,
      distanceCovered: data.distanceCovered || 0,
      distanceRemaining: data.distanceRemaining || 0,
    });

    console.log(
      `📤 Broadcasted location to parent-tracking room:`,
      data.latitude,
      data.longitude
    );
  });

  // Lắng nghe sự kiện từ tài xế gửi vị trí (Real-time từ mobile) - legacy support
  socket.on("driverLocationUpdate", (data) => {
    console.log("Driver location update (legacy):", data);

    // Phát lại cho tất cả client (phụ huynh/admin)
    io.emit("busLocationUpdated", data);
  });

  // Lắng nghe sự kiện cập nhật trạng thái học sinh
  socket.on("studentStatusUpdate", (data) => {
    console.log("Student status update:", data);

    // Phát lại cho tất cả client
    io.emit("studentStatusUpdated", data);
  });
};
