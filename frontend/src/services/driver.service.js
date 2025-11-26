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
        code: driver.driver_code
          ? driver.driver_code.toString().padStart(4, "0")
          : "0000",
        fullname: driver.ho_ten,
        dob: driver.ngay_sinh || "01/01/1990", // Cần thêm vào DB nếu cần
        phone: driver.so_dien_thoai,
        address: driver.dia_chi,
        email: driver.email,
        gender: driver.gioi_tinh || "",
        avatar: `/image/driver-img/${driver.id
          .toString()
          .padStart(4, "0")}.png`,
        licenseNumber: driver.bang_lai,
        vehiclePlate: driver.bien_so_xe || "Chưa phân xe", // Cần join với Schedules/Buses
        monthlyTrips: driver.so_chuyen || 0, // Cần tính từ Schedules
        username: driver.username,
        status: driver.trang_thai_taixe,
        id: driver.id, // User.id from database (for backend API calls)
        driver_code: driver.driver_code, // Keep driver_code for reference
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

  /**
   * Tạo tài xế mới
   * @param {Object} driverData - Thông tin tài xế và tài khoản
   * @returns {Promise<Object>}
   */
  async createDriver(driverData) {
    try {
      // Transform frontend data to backend format
      const payload = {
        username: driverData.username,
        email: driverData.email,
        password_hash: driverData.password, // Backend will hash this
        ho_ten: driverData.fullname,
        ngay_sinh: driverData.dob || null,
        gioi_tinh: driverData.gender || "Nam",
        so_dien_thoai: driverData.phone,
        vai_tro: "taixe",
        dia_chi: driverData.address || null,
        bang_lai: driverData.licenseNumber || null,
        trang_thai_taixe: "Đang hoạt động",
      };

      const response = await api.post("/driver-test", payload);
      return response;
    } catch (error) {
      console.error("Error creating driver:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin tài xế
   * @param {number} id - User ID
   * @param {Object} driverData - Thông tin cập nhật
   * @returns {Promise<Object>}
   */
  async updateDriver(id, driverData) {
    try {
      const payload = {
        ho_ten: driverData.fullname,
        ngay_sinh: driverData.dob,
        gioi_tinh: driverData.gender,
        so_dien_thoai: driverData.phone,
        email: driverData.email,
        dia_chi: driverData.address,
        bang_lai: driverData.licenseNumber,
      };

      // If password is provided, include it
      if (driverData.password) {
        payload.password_hash = driverData.password;
      }

      const response = await api.put(`/driver-test/${id}`, payload);
      return response;
    } catch (error) {
      console.error("Error updating driver:", error);
      throw error;
    }
  },

  /**
   * Xóa tài xế
   * @param {number} id - User ID
   * @returns {Promise<void>}
   */
  async deleteDriver(id) {
    try {
      await api.delete(`/driver-test/${id}`);
    } catch (error) {
      console.error("Error deleting driver:", error);
      throw error;
    }
  },
};

export default DriverService;
