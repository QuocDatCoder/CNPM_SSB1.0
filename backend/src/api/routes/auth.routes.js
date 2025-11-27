const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Public routes
router.post("/login", authController.login);

// Protected routes (cần authentication middleware nếu muốn dùng)
// router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
