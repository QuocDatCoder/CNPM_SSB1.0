import api from "./api";

/**
 * Driver Service - Quản lý tài xế
 * Endpoints: /api/driver-test (lấy Users với vai_tro='taixe')
 */

const DriverService = {
  /**
   * Lấy danh sách tất cả tài xế
   * @returns {Promise<Array>}
   */
  async getAllDrivers() {
    try {
      const response = await api.get("/driver-test");

      return response.map((driver, index) => ({
        code: driver.id.toString().padStart(4, "0"),
        fullname: driver.ho_ten,
        dob: driver.ngay_sinh || "01/01/1990", // Cần thêm vào DB nếu cần
        phone: driver.so_dien_thoai,
        address: driver.dia_chi,
        email: driver.email,
        avatar: `/image/driver-img/${driver.id
          .toString()
          .padStart(4, "0")}.png`,
        licenseNumber: driver.bang_lai,
        vehiclePlate: driver.bien_so_xe || "Chưa phân xe", // Cần join với Schedules/Buses
        monthlyTrips: driver.so_chuyen || 0, // Cần tính từ Schedules
        username: driver.username,
        status: driver.trang_thai_taixe,
        id: driver.id,
      }));
    } catch (error) {
      console.error("Error fetching drivers:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết tài xế
   * @param {string} id - ID tài xế
   * @returns {Promise<Object>}
   */
  async getDriverById(id) {
    try {
      const drivers = await this.getAllDrivers();
      return drivers.find((driver) => driver.id == id);
    } catch (error) {
      console.error("Error fetching driver details:", error);
      throw error;
    }
  },
};

export default DriverService;
