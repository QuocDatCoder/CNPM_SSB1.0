import api from "./api";

/**
 * Bus Service - Quản lý xe buýt
 * Endpoints: /api/buses
 */

const BusService = {
  /**
   * Lấy danh sách tất cả xe buýt
   * @returns {Promise<Array>} Danh sách xe
   */
  async getAllBuses() {
    try {
      const response = await api.get("/buses");
      return response.map((bus) => ({
        id: bus.id.toString(),
        licensePlate: bus.licensePlate,
        manufacturer: bus.manufacturer,
        seats: bus.seats,
        yearManufactured: bus.yearManufactured,
        distanceTraveled: bus.distanceTraveled,
        maintenanceDate: bus.maintenanceDate,
        status: bus.status,
        route: bus.route || "Chưa phân tuyến",
        image: "/image/bus.png", // Default image
      }));
    } catch (error) {
      console.error("Error fetching buses:", error);
      throw error;
    }
  },

  /**
   * Thêm xe buýt mới
   * @param {Object} busData - Thông tin xe mới
   * @returns {Promise<Object>} Xe vừa tạo
   */
  async createBus(busData) {
    try {
      const payload = {
        licensePlate: busData.licensePlate,
        manufacturer: busData.manufacturer,
        yearManufactured: parseInt(busData.yearManufactured),
        seats: parseInt(busData.seats),
        distanceTraveled: 0,
        maintenanceDate: busData.maintenanceDate,
        status: busData.status || "ngừng hoạt động",
      };

      const response = await api.post("/buses", payload);
      return response;
    } catch (error) {
      console.error("Error creating bus:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin xe
   * @param {string} id - ID xe
   * @param {Object} busData - Thông tin cập nhật
   * @returns {Promise<Object>}
   */
  async updateBus(id, busData) {
    try {
      const payload = {
        licensePlate: busData.licensePlate,
        manufacturer: busData.manufacturer,
        yearManufactured: parseInt(busData.yearManufactured),
        seats: parseInt(busData.seats),
        distanceTraveled: parseFloat(busData.distanceTraveled),
        maintenanceDate: busData.maintenanceDate,
        status: busData.status,
      };

      const response = await api.put(`/buses/${id}`, payload);
      return response;
    } catch (error) {
      console.error("Error updating bus:", error);
      throw error;
    }
  },

  /**
   * Xóa xe buýt
   * @param {string} id - ID xe
   * @returns {Promise<void>}
   */
  async deleteBus(id) {
    try {
      await api.delete(`/buses/${id}`);
    } catch (error) {
      console.error("Error deleting bus:", error);
      throw error;
    }
  },
};

export default BusService;
