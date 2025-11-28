const express = require("express");
const {
  startTrip,
  endTrip,
  getCurrentLocation,
  getLocationHistory,
  getActiveTrips,
  getTripStatus,
  saveDriverLocation,
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

// Get current bus location
router.get("/current-location/:scheduleId", verifyToken, getCurrentLocation);

// Get location history for polyline
router.get("/location-history/:scheduleId", verifyToken, getLocationHistory);

// Get all active trips (for admin)
router.get("/active-trips", verifyToken, getActiveTrips);

// Get specific trip status
router.get("/trip-status/:scheduleId", verifyToken, getTripStatus);

module.exports = router;
