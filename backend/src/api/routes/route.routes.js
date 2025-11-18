const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');

// Định nghĩa các đường dẫn
router.post('/', routeController.createRoute);       // Tạo mới
router.get('/', routeController.getAllRoutes);       // Lấy danh sách
router.get('/:id', routeController.getRouteById);    // Lấy chi tiết
router.put('/:id', routeController.updateRoute);     // Sửa
router.delete('/:id', routeController.deleteRoute);  // Xóa

module.exports = router;