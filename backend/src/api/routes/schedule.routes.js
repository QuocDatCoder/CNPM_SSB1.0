const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');

// --- NHÓM QUẢN LÝ LỊCH TRÌNH CHUNG ---
// POST http://localhost:8080/api/schedules
router.post('/', scheduleController.createSchedule);

// GET http://localhost:8080/api/schedules
router.get('/', scheduleController.getSchedules);
router.put('/:id', scheduleController.updateSchedule);     // Sửa   
// DELETE http://localhost:8080/api/schedules/1
router.delete('/:id', scheduleController.deleteSchedule);


// --- NHÓM LỊCH SỬ (LOGS) ---
// GET http://localhost:8080/api/schedules/history/logs?date=...&type=...
router.get('/history/logs', scheduleController.getHistory);


// --- NHÓM XEM LỊCH CÁ NHÂN (TÀI XẾ) ---

// 1. Cho Admin Web xem (View Tuần)
// GET http://localhost:8080/api/schedules/admin/driver
router.get('/admin/driver', scheduleController.getAdminWeekSchedule);

// 2. Cho App Mobile xem (View Danh sách Ngày)
// GET http://localhost:8080/api/schedules/driver/my-schedule/2
router.get('/driver/my-schedule/:driverId', scheduleController.getScheduleDriverApp);

module.exports = router;