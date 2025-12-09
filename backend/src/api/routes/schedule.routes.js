const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/schedule.controller");
const { verifyToken, isDriver } = require("../../middlewares/auth.middleware");

// --- NHÓM API ĐẶC BIỆT (Đặt lên đầu) ---

// 1. Lấy lịch sử logs
// Endpoint: GET /api/schedules/history/logs
router.get("/history/logs", scheduleController.getAssignmentHistory);

// 2. Lấy lịch trình của 1 tài xế trong ngày
// Endpoint: GET /api/schedules/driver/my-schedule
router.get(
  "/driver/my-schedule",
  verifyToken,
  scheduleController.getMySchedule
);

// 3. Lấy học sinh của chuyến hiện tại
// Endpoint: GET /api/schedules/driver/current-students
router.get(
  "/driver/current-students",
  [verifyToken, isDriver],
  scheduleController.getMyCurrentStudents
);

// 4. Phụ huynh xem lịch đi học của con
// Endpoint: GET /api/schedules/parent/my-kids-trip
router.get(
  "/parent/my-kids-trip",
  verifyToken,
  scheduleController.getParentDashboard
);

// 5. Admin xem lịch tuần của 1 tài xế
// Endpoint: GET /api/schedules/admin/driver/:driverId
router.get("/admin/driver/:driverId", scheduleController.getDriverWeekSchedule);

// --- NHÓM API CRUD CƠ BẢN ---

// 6. Lấy danh sách tất cả (Dashboard)
// Endpoint: GET /api/schedules
router.get("/", scheduleController.getAllSchedules);

// 7. Tạo lịch mới
// Endpoint: POST /api/schedules
router.post("/", scheduleController.createSchedule);

// 8. Cập nhật lịch (Theo ID)
// Endpoint: PUT /api/schedules/:id
router.put("/:id", scheduleController.updateSchedule);

// 9. Xóa lịch (Theo ID)
// Endpoint: DELETE /api/schedules/:id
router.delete("/:id", scheduleController.deleteSchedule);

// 10. Lấy danh sách học sinh theo trạm
// Endpoint: GET /api/schedules/:scheduleId/students-by-stop
router.get(
  "/:scheduleId/students-by-stop",
  [verifyToken, isDriver],
  scheduleController.getStudentsByStop
);

// 11. Tính khoảng cách từ tài xế đến các trạm
// Endpoint: POST /api/schedules/:scheduleId/calculate-stop-distances
router.post(
  "/:scheduleId/calculate-stop-distances",
  [verifyToken, isDriver],
  scheduleController.calculateStopDistances
);

// 12. Lấy active schedule cho một route (cho admin dashboard)
// Endpoint: GET /api/schedules/route/:routeId/active
router.get(
  "/route/:routeId/active",
  scheduleController.getActiveScheduleForRoute
);

module.exports = router;
