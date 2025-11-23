const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');

// --- CÁC API QUẢN LÝ LỊCH TRÌNH ---
router.post('/', scheduleController.createSchedule);    
router.get('/', scheduleController.getSchedules);        
router.delete('/:id', scheduleController.deleteSchedule); 

router.get('/history/logs', scheduleController.getHistory);

module.exports = router;