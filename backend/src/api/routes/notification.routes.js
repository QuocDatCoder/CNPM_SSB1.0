const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.use(authMiddleware.verifyToken);

// --- Các Routes Tĩnh (Static) ---

// GET danh sách tin nhắn (query: ?type=inbox&page=1)
router.get('/', notificationController.getMyNotifications);

// POST gửi tin nhắn thường (Admin/User)
router.post('/', notificationController.create);

// POST gửi cảnh báo (Dành riêng cho Driver)
router.post('/alert', notificationController.sendDriverAlert);

// --- Các Routes Động (Dynamic :id) ---

// PUT đánh dấu sao
router.put('/:id/star', notificationController.toggleStar);

// DELETE xóa tin (vào thùng rác)
router.delete('/:id', notificationController.delete);

module.exports = router;