const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');

// --- NHÓM API ĐẶC BIỆT (Đặt lên đầu) ---

// 1. Lấy lịch sử logs
// Endpoint: GET /api/schedules/history/logs
router.get('/history/logs', scheduleController.getAssignmentHistory);

// 2. Admin xem lịch tuần của 1 tài xế
// Endpoint: GET /api/schedules/admin/driver/:driverId
router.get('/admin/driver/:driverId', scheduleController.getDriverWeekSchedule);

// 3. App Tài xế xem lịch của mình
// Endpoint: GET /api/schedules/driver/my-schedule/:driverId
router.get('/driver/my-schedule/:driverId', scheduleController.getMySchedule);


// --- NHÓM API CRUD CƠ BẢN ---

// 4. Lấy danh sách tất cả (Dashboard)
// Endpoint: GET /api/schedules
router.get('/', scheduleController.getAllSchedules);

// 5. Tạo lịch mới
// Endpoint: POST /api/schedules
router.post('/', scheduleController.createSchedule);

// 6. Cập nhật lịch (Theo ID)
// Endpoint: PUT /api/schedules/:id
router.put('/:id', scheduleController.updateSchedule);

// 7. Xóa lịch (Theo ID)
// Endpoint: DELETE /api/schedules/:id
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;