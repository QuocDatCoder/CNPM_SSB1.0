const express = require('express');
const router = express.Router();
console.log("✅ Route Notification đã được nạp!");
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.use(authMiddleware.verifyToken);

// GET danh sách tin nhắn (có query ?type=inbox/sent...)
router.get('/', notificationController.getMyNotifications);

// POST gửi tin
router.post('/', notificationController.create);

// PUT đánh dấu sao
router.put('/:id/star', notificationController.toggleStar);

// DELETE xóa tin (vào thùng rác)
router.delete('/:id', notificationController.delete);


// POST gửi cảnh báo (Dành cho Driver)
router.post('/alert', notificationController.sendAlert);

module.exports = router;