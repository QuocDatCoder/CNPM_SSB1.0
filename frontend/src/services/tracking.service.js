import api from "./api";
import { io } from "socket.io-client";

/**
 * Tracking Service - Quản lý vị trí xe bus real-time
 * Endpoints: /api/tracking
 */

const TrackingService = {
  socket: null,

  /**
   * Khởi tạo WebSocket connection
   */
  initSocket() {
    if (!this.socket) {
      this.socket = io("http://localhost:8080", {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on("connect", () => {
        console.log("✅ Connected to tracking socket:", this.socket.id);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Disconnected from tracking socket");
      });
    }
    return this.socket;
  },

  /**
   * Join tracking room
   */
  joinTrackingRoom(role, userId = null) {
    const socket = this.initSocket();
    socket.emit("join-tracking-room", { role, userId });
  },

  /**
   * Leave tracking room
   */
  leaveTrackingRoom(role, userId = null) {
    if (this.socket) {
      this.socket.emit("leave-tracking-room", { role, userId });
    }
  },

  /**
   * Listen to bus location updates
   */
  onBusLocationUpdate(callback) {
    const socket = this.initSocket();
    socket.on("bus-location-update", callback);
  },

  /**
   * Listen to route completed
   */
  onRouteCompleted(callback) {
    const socket = this.initSocket();
    socket.on("route-completed", callback);
  },

  /**
   * Tài xế gửi vị trí xe bus thực tế tới backend qua WebSocket
   * Data: { latitude, longitude, scheduleId, driverId }
   */
  sendBusLocation(locationData) {
    const socket = this.initSocket();
    socket.emit("driver-location-update", {
      ...locationData,
      timestamp: new Date().toISOString(),
    });
    console.log("📤 Sent bus location via WebSocket:", locationData);
  },

  /**
   * 🚌 Lưu vị trí xe bus lên Backend API (từ FE tài xế)
   * POST /api/tracking/save-location
   * Lưu vào database để phụ huynh có thể xem lịch sử
   */
  async saveDriverLocationToBackend(locationData) {
    try {
      const response = await api.post("/tracking/save-location", {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        scheduleId: locationData.scheduleId,
        driverId: locationData.driverId,
        progressPercentage: locationData.progressPercentage || 0,
        distanceCovered: locationData.distanceCovered || 0,
      });

      console.log("✅ Location saved to backend API:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error saving location to backend:", error);
      // Không throw để không interrupt animation
    }
  },

  /**
   * Bắt đầu chuyến đi
   * PUT /api/tracking/start-trip/:scheduleId
   */
  async startTrip(scheduleId) {
    try {
      const response = await api.put(`/tracking/start-trip/${scheduleId}`);
      return response;
    } catch (error) {
      console.error("Error starting trip:", error);
      throw error;
    }
  },

  /**
   * Kết thúc chuyến đi
   * PUT /api/tracking/end-trip/:scheduleId
   */
  async endTrip(scheduleId) {
    try {
      const response = await api.put(`/tracking/end-trip/${scheduleId}`);
      return response;
    } catch (error) {
      console.error("Error ending trip:", error);
      throw error;
    }
  },

  /**
   * Lấy vị trí hiện tại của xe bus
   * GET /api/tracking/current-location/:scheduleId
   */
  async getCurrentLocation(scheduleId) {
    try {
      const response = await api.get(
        `/tracking/current-location/${scheduleId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting current location:", error);
      throw error;
    }
  },

  /**
   * Lấy lịch sử vị trí
   * GET /api/tracking/location-history/:scheduleId
   */
  async getLocationHistory(scheduleId, limit = 100) {
    try {
      const response = await api.get(
        `/tracking/location-history/${scheduleId}?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting location history:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách chuyến đi đang hoạt động
   * GET /api/tracking/active-trips
   */
  async getActiveTrips() {
    try {
      const response = await api.get("/tracking/active-trips");
      return response.data;
    } catch (error) {
      console.error("Error getting active trips:", error);
      throw error;
    }
  },

  /**
   * Lấy status của trip
   * GET /api/tracking/trip-status/:scheduleId
   */
  async getTripStatus(scheduleId) {
    try {
      const response = await api.get(`/tracking/trip-status/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting trip status:", error);
      throw error;
    }
  },

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  },
};

export default TrackingService;
