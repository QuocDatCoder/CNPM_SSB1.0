const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');

// Nhóm API Lịch trình
router.post('/', scheduleController.createSchedule);      // Thêm
router.get('/', scheduleController.getSchedules);         // Xem
router.delete('/:id', scheduleController.deleteSchedule); // Xóa

// Nhóm API Lịch sử (Log)
router.get('/history/logs', scheduleController.getHistory);

module.exports = router;