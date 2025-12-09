const scheduleService = require("../../services/schedule.service");

const scheduleController = {
  // 1. Lấy danh sách tất cả lịch trình (Dashboard)
  getAllSchedules: async (req, res) => {
    try {
      const schedules = await scheduleService.getAllSchedules();
      res.status(200).json(schedules);
    } catch (error) {
      res.status(500).json({
        message: "Lỗi lấy danh sách lịch trình",
        error: error.message,
      });
    }
  },

  // 2. Tạo lịch trình mới
  createSchedule: async (req, res) => {
    try {
      // req.body chứa: { route_id, driver_id, bus_id, ngay_chay, gio_bat_dau }
      const newSchedule = await scheduleService.createSchedule(req.body);
      res.status(201).json(newSchedule);
    } catch (error) {
      // Trả về 400 nếu lỗi logic (ví dụ: trùng lịch)
      res.status(400).json({ message: error.message });
    }
  },

  // 3. Cập nhật lịch trình
  updateSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedSchedule = await scheduleService.updateSchedule(
        id,
        req.body
      );
      res.status(200).json(updatedSchedule);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // 4. Xóa lịch trình
  deleteSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      await scheduleService.deleteSchedule(id);
      res.status(204).send(); // 204 No Content (Xóa thành công)
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi xóa lịch trình", error: error.message });
    }
  },

  // 5. Lấy lịch làm việc 1 tuần của tài xế (Admin xem)
  getDriverWeekSchedule: async (req, res) => {
    try {
      const { driverId } = req.params;
      const weekSchedule = await scheduleService.getDriverWeekSchedule(
        driverId
      );
      res.status(200).json(weekSchedule);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi lấy lịch tài xế", error: error.message });
    }
  },

  // 6. Lấy lịch làm việc (App Tài xế xem)
  getMySchedule: async (req, res) => {
    try {
      const driverId = req.user.id;

      // Gọi Service với ID vừa lấy được
      const data = await scheduleService.getMySchedule(driverId);

      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 7. Lấy lịch sử phân công (History Logs)
  getAssignmentHistory: async (req, res) => {
    try {
      // Lấy query params từ URL: ?date=2024-05-20&type=luot_di
      const filters = {
        date: req.query.date,
        type: req.query.type,
      };
      const history = await scheduleService.getAssignmentHistory(filters);
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi lấy lịch sử",
        error: error.message,
      });
    }
  },
  getMyCurrentStudents: async (req, res) => {
    try {
      // Lấy ID từ Token (Middleware đã verify)
      const driverId = req.user.id;
      // Lấy filter loai_tuyen từ query params (tùy chọn)
      const loaiTuyen = req.query.loai_tuyen; // 'luot_di' hoặc 'luot_ve'

      const result = await scheduleService.getStudentsForDriverCurrentTrip(
        driverId,
        loaiTuyen
      );

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Cập nhật trạng thái học sinh
  updateStudentStatus: async (req, res) => {
    try {
      const { schedule_id, student_id, trang_thai } = req.body;

      if (!schedule_id || !student_id || !trang_thai) {
        return res.status(400).json({
          success: false,
          message: "Thiếu dữ liệu: schedule_id, student_id, trang_thai",
        });
      }

      const result = await scheduleService.updateStudentStatus(
        schedule_id,
        student_id,
        trang_thai
      );

      res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái học sinh thành công",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  getParentDashboard: async (req, res) => {
    try {
      // Lấy ID phụ huynh từ Token
      const parentId = req.user.id;
      console.log(`🔍 getParentDashboard called for parentId: ${parentId}`);

      const data = await scheduleService.getParentDashboardInfo(parentId);
      console.log(
        `✅ getParentDashboard succeeded, returning ${data.length} children`
      );

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error(
        `❌ getParentDashboard error for parentId ${req.user.id}:`,
        error
      );
      console.error(`Stack trace:`, error.stack);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Lấy danh sách học sinh theo trạm của 1 chuyến đi
  // GET /api/schedules/:scheduleId/students-by-stop
  getStudentsByStop: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const students = await scheduleService.getStudentsByStop(scheduleId);
      res.status(200).json({
        success: true,
        data: students,
      });
    } catch (error) {
      console.error("Error getting students by stop:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Tính khoảng cách giữa vị trí tài xế và các trạm
  // POST /api/schedules/:scheduleId/calculate-stop-distances
  calculateStopDistances: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const { driverLat, driverLng } = req.body;

      if (!driverLat || !driverLng) {
        return res.status(400).json({
          success: false,
          message: "Missing driver location (driverLat, driverLng)",
        });
      }

      const distances = await scheduleService.calculateStopDistances(
        scheduleId,
        driverLat,
        driverLng
      );

      res.status(200).json({
        success: true,
        data: distances,
      });
    } catch (error) {
      console.error("Error calculating stop distances:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get active schedule for a route (cho admin dashboard)
  getActiveScheduleForRoute: async (req, res) => {
    try {
      const { routeId } = req.params;
      const { Schedule } = require("../../data/models");

      // Tìm schedule đang chạy cho route này
      const activeSchedule = await Schedule.findOne({
        where: {
          route_id: routeId,
          trang_thai: "dangchay", // Status phải là 'dangchay'
        },
      });

      if (!activeSchedule) {
        return res.status(404).json({
          message: "No active schedule found for this route",
        });
      }

      res.status(200).json({
        id: activeSchedule.id,
        route_id: activeSchedule.route_id,
        schedule_id: activeSchedule.id,
        driver_id: activeSchedule.driver_id,
        bus_id: activeSchedule.bus_id,
        status: activeSchedule.trang_thai,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching active schedule",
        error: error.message,
      });
    }
  },
};

module.exports = scheduleController;
