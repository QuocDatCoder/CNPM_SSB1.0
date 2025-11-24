const express = require('express');
const router = express.Router();
const stopController = require('../controllers/stop.controller');

// Định nghĩa các đường dẫn (Chỉ còn GET)
router.get('/', stopController.getAllStops);       // GET /api/stops
router.get('/:id', stopController.getStopById);    // GET /api/stops/1

module.exports = router;