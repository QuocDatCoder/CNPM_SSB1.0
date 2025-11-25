import api from "./api";

/**
 * Schedule Service - Quản lý lịch trình
 * Endpoints: /api/schedules
 */

const ScheduleService = {
  /**
   * Lấy danh sách tất cả lịch trình
   * @returns {Promise<Array>}
   */
  async getAllSchedules() {
    try {
      const schedules = await api.get("/schedules");
      return schedules;
    } catch (error) {
      console.error("Error fetching schedules:", error);
      throw error;
    }
  },

  /**
   * Tạo lịch trình mới
   * @param {Object} scheduleData - Dữ liệu lịch trình
   * @returns {Promise<Object>}
   */
  async createSchedule(scheduleData) {
    try {
      const payload = {
        route_id: parseInt(scheduleData.route_id),
        driver_id: parseInt(scheduleData.driver_id),
        bus_id: parseInt(scheduleData.bus_id),
        ngay_chay: scheduleData.ngay_chay, // Format: YYYY-MM-DD
        gio_bat_dau: scheduleData.gio_bat_dau, // Format: HH:MM:SS
      };

      const response = await api.post("/schedules", payload);
      return response;
    } catch (error) {
      console.error("Error creating schedule:", error);
      throw error;
    }
  },

  /**
   * Cập nhật lịch trình
   * @param {string} id - ID lịch trình
   * @param {Object} scheduleData - Dữ liệu cập nhật
   * @returns {Promise<Object>}
   */
  async updateSchedule(id, scheduleData) {
    try {
      const payload = {
        route_id: parseInt(scheduleData.route_id),
        driver_id: parseInt(scheduleData.driver_id),
        bus_id: parseInt(scheduleData.bus_id),
        ngay_chay: scheduleData.ngay_chay,
        gio_bat_dau: scheduleData.gio_bat_dau,
      };

      const response = await api.put(`/schedules/${id}`, payload);
      return response;
    } catch (error) {
      console.error("Error updating schedule:", error);
      throw error;
    }
  },

  /**
   * Xóa lịch trình
   * @param {string} id - ID lịch trình
   * @returns {Promise<void>}
   */
  async deleteSchedule(id) {
    try {
      await api.delete(`/schedules/${id}`);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      throw error;
    }
  },

  /**
   * Lấy lịch làm việc theo tuần của tài xế (Admin view)
   * @param {string} driverId - ID tài xế
   * @returns {Promise<Array>}
   */
  async getDriverWeekSchedule(driverId) {
    try {
      const response = await api.get(`/schedules/admin/driver/${driverId}`);
      return response;
    } catch (error) {
      console.error("Error fetching driver week schedule:", error);
      throw error;
    }
  },

  /**
   * Lấy lịch làm việc của tài xế (Driver view - danh sách ngày)
   * @param {string} driverId - ID tài xế
   * @returns {Promise<Array>}
   */
  async getMySchedule(driverId) {
    try {
      const response = await api.get(
        `/schedules/driver/my-schedule/${driverId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching my schedule:", error);
      throw error;
    }
  },

  /**
   * Lấy lịch sử phân công
   * @param {Object} filters - Bộ lọc (date, type)
   * @returns {Promise<Array>}
   */
  async getAssignmentHistory(filters = {}) {
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.type) params.type = filters.type;

      const response = await api.get("/schedules/history/logs", params);
      return response;
    } catch (error) {
      console.error("Error fetching assignment history:", error);
      throw error;
    }
  },
};

export default ScheduleService;
