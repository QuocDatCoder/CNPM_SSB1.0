import io from "socket.io-client";

class ParentTrackingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = {};
  }

  /**
   * Khởi tạo Socket.io connection
   */
  initSocket() {
    if (this.socket) {
      return this.socket;
    }

    try {
      this.socket = io("http://localhost:8080", {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on("connect", () => {
        console.log("✅ Parent tracking connected to server");
        this.isConnected = true;
        this.emit("connected");
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Parent tracking disconnected from server");
        this.isConnected = false;
        this.emit("disconnected");
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      return this.socket;
    } catch (error) {
      console.error("Error initializing socket:", error);
      return null;
    }
  }

  /**
   * Tham gia room theo dõi cho phụ huynh
   */
  joinParentTracking() {
    if (!this.socket) {
      this.initSocket();
    }

    if (this.socket) {
      this.socket.emit("join-parent-tracking", {
        timestamp: new Date().toISOString(),
      });
      console.log("📍 Parent joined tracking room");
    }
  }

  /**
   * Lắng nghe cập nhật vị trí xe bus (một lần duy nhất)
   * @param {Function} callback - Hàm callback khi nhận vị trí mới
   */
  onBusLocationUpdate(callback) {
    if (!this.socket) {
      this.initSocket();
    }

    // 🚨 Xóa listener cũ trước khi thêm listener mới để tránh duplicate
    this.socket?.off("bus-location-update");

    this.socket?.on("bus-location-update", (data) => {
      console.log("📍 Bus location update:", data);
      callback(data);
    });
  }

  /**
   * Lắng nghe thông báo chuyến đi hoàn thành (một lần duy nhất)
   * @param {Function} callback
   */
  onRouteCompleted(callback) {
    if (!this.socket) {
      this.initSocket();
    }

    // 🚨 Xóa listener cũ trước khi thêm listener mới để tránh duplicate
    this.socket?.off("route-completed");

    this.socket?.on("route-completed", (data) => {
      console.log("✅ Route completed:", data);
      callback(data);
    });
  }

  /**
   * Lấy vị trí hiện tại của xe bus cho một chuyến đi
   * @param {Number} scheduleId - ID của chuyến đi
   */
  async getCurrentLocation(scheduleId) {
    try {
      const response = await fetch(
        `http://localhost:8080/api/tracking/current-location/${scheduleId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching current location:", error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử vị trí của xe bus
   * @param {Number} scheduleId - ID của chuyến đi
   */
  async getLocationHistory(scheduleId) {
    try {
      const response = await fetch(
        `http://localhost:8080/api/tracking/location-history/${scheduleId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching location history:", error);
      throw error;
    }
  }

  /**
   * Rời khỏi room
   */
  leaveParentTracking() {
    if (this.socket) {
      this.socket.emit("leave-parent-tracking");
      console.log("📍 Parent left tracking room");
    }
  }

  /**
   * Ngắt kết nối
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Kiểm tra kết nối
   */
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  /**
   * Custom event emitter
   */
  emit(event, data) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].forEach((callback) => callback(data));
  }

  /**
   * Lắng nghe custom event
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  }

  /**
   * Hủy lắng nghe
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }
}

export default new ParentTrackingService();
