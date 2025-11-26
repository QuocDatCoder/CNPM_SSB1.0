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
        id: bus.id, // Keep as number for comparisons
        licensePlate: bus.bien_so_xe,
        manufacturer: bus.hang_xe,
        seats: bus.so_ghe,
        yearManufactured: bus.nam_san_xuat,
        distanceTraveled: bus.so_km_da_chay,
        maintenanceDate: bus.lich_bao_duong,
        status: bus.trang_thai, // Keep original: 'Đang hoạt động', 'Bảo trì', 'Ngừng'
        route: bus.ten_tuyen || "Chưa phân tuyến",
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
      // Frontend sends English names, convert to Vietnamese for database
      const payload = {
        bien_so_xe: busData.licensePlate,
        hang_xe: busData.manufacturer,
        nam_san_xuat: parseInt(busData.yearManufactured),
        so_ghe: parseInt(busData.seats),
        so_km_da_chay: 0,
        lich_bao_duong: busData.maintenanceDate,
        trang_thai: "Ngừng", // Default: Ngừng (matches DB ENUM)
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
      // Frontend sends English names, convert to Vietnamese for database
      const payload = {
        bien_so_xe: busData.licensePlate,
        hang_xe: busData.manufacturer,
        nam_san_xuat: parseInt(busData.yearManufactured),
        so_ghe: parseInt(busData.seats),
        so_km_da_chay: parseFloat(busData.distanceTraveled),
        lich_bao_duong: busData.maintenanceDate,
        trang_thai: busData.status,
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
