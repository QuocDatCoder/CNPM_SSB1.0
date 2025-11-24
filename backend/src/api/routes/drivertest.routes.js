const express = require('express');
const router = express.Router();
// Import đúng controller mới đổi tên
const driverTestController = require('../controllers/drivertest.controller');

// GET /api/driver-test -> Lấy danh sách
router.get('/', driverTestController.getDrivers);

// POST /api/driver-test -> Tạo mới
router.post('/', driverTestController.createDriver);

module.exports = router;