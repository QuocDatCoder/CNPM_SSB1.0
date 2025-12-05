const express = require("express");
const {
  startTrip,
  endTrip,
  getCurrentLocation,
  getLocationHistory,
  getActiveTrips,
  getTripStatus,
  saveDriverLocation,
  updateScheduleStudentStatus,
  resetScheduleStudentStatuses,
} = require("../controllers/tracking.controller.js");
const {
  verifyToken,
  isDriver,
} = require("../../middlewares/auth.middleware.js");

const router = express.Router();

// Start trip - khởi động simulator
router.put("/start-trip/:scheduleId", verifyToken, isDriver, startTrip);

// End trip - dừng simulator
router.put("/end-trip/:scheduleId", verifyToken, isDriver, endTrip);

// 🚌 Save driver location (từ FE tài xế gửi)
router.post("/save-location", verifyToken, isDriver, saveDriverLocation);

// 👨‍🎓 Cập nhật trạng thái học sinh (Tài xế cập nhật khi đón/trả học sinh)
router.put(
  "/schedule-student/:scheduleStudentId",
  verifyToken,
  isDriver,
  updateScheduleStudentStatus
);

// ✅ Reset tất cả học sinh trong schedule về 'choxacnhan' (Khi bắt đầu chuyến mới)
router.put(
  "/reset-students/:scheduleId",
  verifyToken,
  isDriver,
  resetScheduleStudentStatuses
);

// Get current bus location
router.get("/current-location/:scheduleId", verifyToken, getCurrentLocation);

// Get location history for polyline
router.get("/location-history/:scheduleId", verifyToken, getLocationHistory);

// Get all active trips (for admin)
router.get("/active-trips", verifyToken, getActiveTrips);

// Get specific trip status
router.get("/trip-status/:scheduleId", verifyToken, getTripStatus);

module.exports = router;
