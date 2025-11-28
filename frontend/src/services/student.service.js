import api from "./api";

/**
 * Student Service - Quản lý học sinh
 * Endpoints: /api/students
 */

const StudentService = {
  /**
   * Lấy danh sách tất cả học sinh
   * @returns {Promise<Array>} Danh sách học sinh đã format
   */
  async getAllStudents() {
    try {
      const response = await api.get("/students/");

      // Map dữ liệu từ Backend sang Frontend
      return response.map((student) => ({
        id: student.id,
        // Thông tin học sinh
        ho_ten: student.ho_ten,
        lop: student.lop,
        ngay_sinh: student.ngay_sinh,
        gioi_tinh: student.gioi_tinh,
        gvcn: student.gvcn,

        // Thông tin tuyến/trạm
        current_route_id: student.current_route_id,
        current_stop_id: student.current_stop_id,
        tuyen_duong: student.tuyen_duong,
        tram_don: student.tram_don,
        dia_chi_tram: student.dia_chi_tram,

        // Thông tin phụ huynh
        ten_phu_huynh: student.ten_phu_huynh,
        sdt_phu_huynh: student.sdt_phu_huynh,
        email_phu_huynh: student.email_phu_huynh,
        dia_chi: student.dia_chi,
      }));
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  },

  /**
   * Tạo học sinh mới (kèm tạo phụ huynh)
   * @param {Object} studentData - Dữ liệu từ form frontend
   * @returns {Promise<Object>}
   */
  async createStudent(studentData) {
    try {
      // Convert từ Frontend sang Backend
      const payload = {
        // Thông tin phụ huynh
        ho_ten_ph: studentData.parentName,
        sdt_ph: studentData.parentPhone,
        email_ph: studentData.parentEmail,
        dia_chi: studentData.address,
        password: studentData.password,

        // Thông tin học sinh
        ho_ten_hs: studentData.studentName,
        lop: studentData.class,
        ngay_sinh: studentData.dob, // Format: YYYY-MM-DD
        gioi_tinh: studentData.gender,
        gvcn: studentData.teacher,

        // Id tuyến và trạm
        route_id: studentData.routeId ? parseInt(studentData.routeId) : null,
        stop_id: studentData.stopId ? parseInt(studentData.stopId) : null,
      };

      const response = await api.post("/students/with-parent", payload);
      return response;
    } catch (error) {
      console.error("Error creating student:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin học sinh
   * @param {string|number} id - ID học sinh
   * @param {Object} studentData - Dữ liệu cần sửa
   * @returns {Promise<Object>}
   */
  async updateStudent(id, studentData) {
    try {
      // Payload chỉ chứa các field cho phép update
      const payload = {
        ho_ten_hs: studentData.studentName,
        lop: studentData.class,
        route_id: studentData.routeId ? parseInt(studentData.routeId) : null,
        stop_id: studentData.stopId ? parseInt(studentData.stopId) : null,
      };

      const response = await api.put(`/students/${id}`, payload);
      return response;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  },

  /**
   * Xóa học sinh
   * @param {string|number} id - ID học sinh
   * @returns {Promise<void>}
   */
  async deleteStudent(id) {
    try {
      await api.delete(`/students/${id}`);
    } catch (error) {
      console.error("Error deleting student:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách học sinh của lịch trình hiện tại của tài xế
   * @param {string} loaiTuyen - Loại tuyến: 'luot_di' hoặc 'luot_ve' (tùy chọn)
   * @returns {Promise<Object>} {current_schedule, students}
   */
  async getCurrentScheduleStudents(loaiTuyen = null) {
    try {
      // Gọi API từ schedule endpoint chứ không phải students
      let url = "/schedules/driver/current-students";

      // Thêm query param nếu có loai_tuyen
      if (loaiTuyen) {
        url += `?loai_tuyen=${loaiTuyen}`;
      }

      const response = await api.get(url);
      console.log("📚 API Response - Current Schedule Students:", response);

      // Response structure:
      // {
      //   current_schedule: { id, gio_bat_dau, trang_thai, loai_tuyen },
      //   students: [ { schedule_id, student_id, trang_thai, ho_ten_hs, ... } ]
      // }

      return response;
    } catch (error) {
      console.error("Error fetching current schedule students:", error);
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái học sinh trong lịch trình
   * @param {number} scheduleId - ID lịch trình
   * @param {number} studentId - ID học sinh
   * @param {string} status - Trạng thái mới (choxacnhan, dihoc, vangmat, daxuong)
   * @returns {Promise<Object>}
   */
  async updateStudentStatus(scheduleId, studentId, status) {
    try {
      const response = await api.put("/schedules/driver/student-status", {
        schedule_id: scheduleId,
        student_id: studentId,
        trang_thai: status,
      });
      console.log(
        `📝 Updated student ${studentId} status to ${status}:`,
        response
      );
      return response;
    } catch (error) {
      console.error("Error updating student status:", error);
      throw error;
    }
  },
};

export default StudentService;
