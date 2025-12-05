import api from "./api";

class StopService {
  /**
   * Lấy danh sách học sinh theo trạm của 1 chuyến đi
   * @param {number} scheduleId - ID của schedule
   */
  async getStudentsByStop(scheduleId) {
    try {
      const response = await api.get(
        `/schedules/${scheduleId}/students-by-stop`
      );
      console.log("📚 Students by stop response:", response);
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error("Error fetching students by stop:", error);
      throw error;
    }
  }

  /**
   * Tính khoảng cách từ vị trí tài xế đến các trạm
   * @param {number} scheduleId - ID của schedule
   * @param {number} driverLat - Latitude vị trí tài xế
   * @param {number} driverLng - Longitude vị trí tài xế
   */
  async calculateStopDistances(scheduleId, driverLat, driverLng) {
    try {
      const response = await api.post(
        `/schedules/${scheduleId}/calculate-stop-distances`,
        {
          driverLat,
          driverLng,
        }
      );
      console.log("📍 Stop distances response:", response);
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error("Error calculating stop distances:", error);
      throw error;
    }
  }

  /**
   * Kết hợp: Lấy danh sách học sinh + tính khoảng cách
   * @param {number} scheduleId - ID của schedule
   * @param {number} driverLat - Latitude vị trí tài xế
   * @param {number} driverLng - Longitude vị trí tài xế
   */
  async getStopsWithStudents(scheduleId, driverLat, driverLng) {
    try {
      // Lấy 2 thông tin song song
      const [studentsByStop, stopDistances] = await Promise.all([
        this.getStudentsByStop(scheduleId),
        this.calculateStopDistances(scheduleId, driverLat, driverLng),
      ]);

      // Kết hợp dữ liệu: Thêm thông tin học sinh vào stopDistances
      const stopsWithStudents = stopDistances.map((stop) => ({
        ...stop,
        students:
          studentsByStop.find((s) => s.stopId === stop.stopId)?.students || [],
      }));

      return stopsWithStudents;
    } catch (error) {
      console.error("Error getting stops with students:", error);
      throw error;
    }
  }
}

export default new StopService();
