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
      // API client automatically extracts .data from response
      const students = await api.get("/students/");
      console.log(
        "📚 getAllStudents response (should be array):",
        Array.isArray(students),
        students[0]
      ); // Debug log

      // Ensure we have an array
      const studentData = Array.isArray(students) ? students : [];

      // Map dữ liệu từ Backend sang Frontend
      return studentData.map((student) => ({
        id: student.id,
        // Thông tin học sinh
        ho_ten: student.ho_ten,
        lop: student.lop,
        ngay_sinh: student.ngay_sinh,
        gioi_tinh: student.gioi_tinh,
        gvcn: student.gvcn,

        // Thông tin phụ huynh
        parent_id: student.parent_id,
        ten_phu_huynh: student.ten_phu_huynh,
        sdt_phu_huynh: student.sdt_phu_huynh,
        email_phu_huynh: student.email_phu_huynh,
        dia_chi: student.dia_chi,
        username_phu_huynh: student.username_phu_huynh,
        password_phu_huynh: student.password_phu_huynh,

        // Lượt Đi (Sáng)
        tuyen_duong_di: student.tuyen_duong_di,
        tram_don_di: student.tram_don_di,
        dia_chi_tram_di: student.dia_chi_tram_di,
        default_route_stop_id_di: student.default_route_stop_id_di,

        // Lượt Về (Chiều)
        tuyen_duong_ve: student.tuyen_duong_ve,
        tram_don_ve: student.tram_don_ve,
        dia_chi_tram_ve: student.dia_chi_tram_ve,
        default_route_stop_id_ve: student.default_route_stop_id_ve,
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
      // Frontend gửi: ho_ten_ph, sdt_ph, email_ph, username, password, dia_chi
      // Frontend gửi: ho_ten_hs, lop, ngay_sinh, gioi_tinh, gvcn
      // Frontend gửi: route_id_di, stop_id_di, route_id_ve, stop_id_ve
      const payload = {
        // Thông tin phụ huynh
        ho_ten_ph: studentData.ho_ten_ph,
        sdt_ph: studentData.sdt_ph,
        email_ph: studentData.email_ph,
        dia_chi: studentData.dia_chi,
        username: studentData.username || "",
        password: studentData.password,

        // Thông tin học sinh
        ho_ten_hs: studentData.ho_ten_hs,
        lop: studentData.lop,
        ngay_sinh: studentData.ngay_sinh, // Format: YYYY-MM-DD
        gioi_tinh: studentData.gioi_tinh,
        gvcn: studentData.gvcn,

        // Lượt Đi (Sáng)
        route_id_di: studentData.route_id_di
          ? parseInt(studentData.route_id_di)
          : null,
        stop_id_di: studentData.stop_id_di
          ? parseInt(studentData.stop_id_di)
          : null,

        // Lượt Về (Chiều)
        route_id_ve: studentData.route_id_ve
          ? parseInt(studentData.route_id_ve)
          : null,
        stop_id_ve: studentData.stop_id_ve
          ? parseInt(studentData.stop_id_ve)
          : null,
      };

      console.log("📤 StudentService payload:", payload);
      const response = await api.post("/students/with-parent", payload);
      return response;
    } catch (error) {
      console.error("Error creating student:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin học sinh và phụ huynh
   * @param {string|number} id - ID học sinh
   * @param {Object} studentData - Dữ liệu cần sửa
   * @returns {Promise<Object>}
   */
  async updateStudent(id, studentData) {
    try {
      // Payload chứa toàn bộ thông tin học sinh và phụ huynh
      const payload = {
        // Thông tin học sinh
        ho_ten_hs: studentData.fullname,
        lop: studentData.class,
        ngay_sinh: studentData.dob,
        gioi_tinh: studentData.gender,
        gvcn: studentData.teacher,
        route_id: studentData.route_id ? parseInt(studentData.route_id) : null,
        stop_id: studentData.stop_id ? parseInt(studentData.stop_id) : null,

        // Thông tin phụ huynh
        ho_ten_ph: studentData.parentName,
        sdt_ph: studentData.contact,
        email_ph: studentData.parentEmail,
        dia_chi: studentData.address,
        username_phu_huynh: studentData.username_phu_huynh,
        password_phu_huynh: studentData.password_phu_huynh,
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
