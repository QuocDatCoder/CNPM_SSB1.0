const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/schedule.controller");
const { verifyToken, isDriver } = require("../../middlewares/auth.middleware");

// --- NHÓM API ĐẶC BIỆT (Đặt lên đầu) ---

// 1. Lấy lịch sử logs
// Endpoint: GET /api/schedules/history/logs
router.get("/history/logs", scheduleController.getAssignmentHistory);

// 2. App Tài xế xem lịch của mình (TRƯỚC routes khác /driver)
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

// 4. Admin xem lịch tuần của 1 tài xế
// Endpoint: GET /api/schedules/admin/driver/:driverId
router.get("/admin/driver/:driverId", scheduleController.getDriverWeekSchedule);

// --- NHÓM API CRUD CƠ BẢN ---

// 5. Lấy danh sách tất cả (Dashboard)
// Endpoint: GET /api/schedules
router.get("/", scheduleController.getAllSchedules);

// 6. Tạo lịch mới
// Endpoint: POST /api/schedules
router.post("/", scheduleController.createSchedule);

// 7. Cập nhật lịch (Theo ID)
// Endpoint: PUT /api/schedules/:id
router.put("/:id", scheduleController.updateSchedule);

// 8. Xóa lịch (Theo ID)
// Endpoint: DELETE /api/schedules/:id
router.delete("/:id", scheduleController.deleteSchedule);

module.exports = router;
