const express = require("express");
const {
  updateLocation,
  updateStudentStatus,
} = require("../controllers/tracking.controller.js");
const {
  verifyToken,
  isDriver,
} = require("../../middlewares/auth.middleware.js");

const router = express.Router();

// Endpoint cập nhật vị trí xe (chỉ tài xế được phép)
router.post("/location", verifyToken, isDriver, updateLocation);

// Endpoint cập nhật trạng thái học sinh (chỉ tài xế được phép)
router.post("/student-status", verifyToken, isDriver, updateStudentStatus);

module.exports = router;
