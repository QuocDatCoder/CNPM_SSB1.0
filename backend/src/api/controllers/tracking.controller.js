const { errorHandler } = require("../../middlewares/auth.middleware.js");
const {
  startBusSimulator,
  stopBusSimulator,
  getActiveSimulators,
  getSimulatorStatus,
} = require("../../services/bus-simulator.service");
const {
  Schedule,
  Bus,
  User,
  LocationHistory,
  ScheduleStudent,
} = require("../../data/models");

/**
 * Start trip - khởi động simulator và cập nhật trạng thái
 */
async function startTrip(req, res) {
  try {
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    // Lấy schedule
    const schedule = await Schedule.findByPk(scheduleId, {
      include: [
        { model: Bus, attributes: ["id", "bien_so_xe", "trang_thai"] },
        { model: User, as: "driver", attributes: ["id", "trang_thai_taixe"] },
      ],
    });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Cập nhật trạng thái
    await schedule.update({ trang_thai: "dangchay" });
    await schedule.Bus.update({ trang_thai: "Đang hoạt động" });
    if (schedule.driver) {
      await schedule.driver.update({ trang_thai_taixe: "hoatdong" });
    }

    // 📢 Emit trip status change event để parents nhận được real-time update
    if (global.io) {
      global.io.to("parent-tracking").emit("trip-status-changed", {
        scheduleId: schedule.id,
        status: "dangchay",
        statusLabel: "Đang chạy",
        timestamp: new Date().toISOString(),
      });
      console.log(`📢 Emitted trip-status-changed for schedule ${schedule.id}`);
    }

    // Khởi động simulator (sử dụng global.io)
    await startBusSimulator(scheduleId, global.io);

    res.json({
      message: "Trip started successfully",
      schedule: {
        id: schedule.id,
        status: "dangchay",
        bus: { bien_so_xe: schedule.Bus?.bien_so_xe },
        driver: { id: schedule.driver?.id },
      },
    });
  } catch (error) {
    console.error("Error starting trip:", error);
    res
      .status(500)
      .json({ message: "Error starting trip", error: error.message });
  }
}

/**
 * End trip - dừng simulator và revert trạng thái
 */
async function endTrip(req, res) {
  try {
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    // Lấy schedule
    const schedule = await Schedule.findByPk(scheduleId, {
      include: [
        { model: Bus, attributes: ["id", "bien_so_xe", "trang_thai"] },
        { model: User, as: "driver", attributes: ["id", "trang_thai_taixe"] },
      ],
    });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Dừng simulator
    await stopBusSimulator(scheduleId);

    // Revert trạng thái
    await schedule.update({ trang_thai: "hoanthanh" });
    await schedule.Bus.update({ trang_thai: "Ngừng" });
    if (schedule.driver) {
      await schedule.driver.update({ trang_thai_taixe: "tamdung" });
    }

    // 📢 Emit trip status change event để parents nhận được real-time update
    if (global.io) {
      global.io.to("parent-tracking").emit("trip-status-changed", {
        scheduleId: schedule.id,
        status: "hoanthanh",
        statusLabel: "Hoàn thành",
        timestamp: new Date().toISOString(),
      });
      console.log(`📢 Emitted trip-status-changed for schedule ${schedule.id}`);
    }

    res.json({
      message: "Trip ended successfully",
      schedule: {
        id: schedule.id,
        status: "hoanthanh",
      },
    });
  } catch (error) {
    console.error("Error ending trip:", error);
    res
      .status(500)
      .json({ message: "Error ending trip", error: error.message });
  }
}

/**
 * Get current location of bus
 */
async function getCurrentLocation(req, res) {
  try {
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    const latestLocation = await LocationHistory.findOne({
      where: { schedule_id: scheduleId },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    if (!latestLocation) {
      return res
        .status(404)
        .json({ message: "No location found for this schedule" });
    }

    res.json({
      location: {
        latitude: latestLocation.latitude,
        longitude: latestLocation.longitude,
        timestamp: latestLocation.createdAt,
      },
    });
  } catch (error) {
    console.error("Error getting current location:", error);
    res.status(500).json({
      message: "Error getting current location",
      error: error.message,
    });
  }
}

/**
 * Get location history for polyline
 */
async function getLocationHistory(req, res) {
  try {
    const { scheduleId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    const locations = await LocationHistory.findAll({
      where: { schedule_id: scheduleId },
      order: [["createdAt", "ASC"]],
      limit: limit,
      attributes: ["latitude", "longitude", "createdAt"],
    });

    const polyline = locations.map((loc) => [loc.latitude, loc.longitude]);

    res.json({
      polyline: polyline,
      count: locations.length,
    });
  } catch (error) {
    console.error("Error getting location history:", error);
    res.status(500).json({
      message: "Error getting location history",
      error: error.message,
    });
  }
}

/**
 * Get all active trips
 */
async function getActiveTrips(req, res) {
  try {
    const activeSimulators = getActiveSimulators();

    const trips = await Promise.all(
      activeSimulators.map(async (simulator) => {
        const schedule = await Schedule.findByPk(simulator.scheduleId, {
          include: [{ model: Bus, attributes: ["bien_so_xe"] }],
        });

        return {
          scheduleId: simulator.scheduleId,
          busNumber: schedule?.Bus?.bien_so_xe || "N/A",
          status: simulator.isRunning ? "Đang chạy" : "Tạm dừng",
          progress: {
            percentage: simulator.progressPercentage || 0,
            distanceCovered: simulator.distanceCovered || 0,
          },
        };
      })
    );

    res.json({ activeTrips: trips, count: trips.length });
  } catch (error) {
    console.error("Error getting active trips:", error);
    res
      .status(500)
      .json({ message: "Error getting active trips", error: error.message });
  }
}

/**
 * Get trip status
 */
async function getTripStatus(req, res) {
  try {
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    const status = getSimulatorStatus(scheduleId);

    if (!status) {
      return res.status(404).json({ message: "Trip not found or not running" });
    }

    res.json({
      scheduleId: scheduleId,
      status: status,
    });
  } catch (error) {
    console.error("Error getting trip status:", error);
    res
      .status(500)
      .json({ message: "Error getting trip status", error: error.message });
  }
}

/**
 * 🚌 Lưu vị trí xe bus được tài xế gửi từ FE
 * POST /api/tracking/save-location
 * Body: { latitude, longitude, scheduleId, driverId, progressPercentage, distanceCovered }
 */
async function saveDriverLocation(req, res) {
  try {
    const {
      latitude,
      longitude,
      scheduleId,
      driverId,
      progressPercentage,
      distanceCovered,
    } = req.body;

    // Validate
    if (!latitude || !longitude || !scheduleId) {
      return res.status(400).json({
        message: "Missing required fields: latitude, longitude, scheduleId",
      });
    }

    // Lưu vào LocationHistory database
    const locationRecord = await LocationHistory.create({
      schedule_id: scheduleId,
      driver_id: driverId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      progress_percentage: progressPercentage || 0,
      distance_covered: distanceCovered || 0,
    });

    console.log("✅ Driver location saved:", {
      scheduleId,
      latitude,
      longitude,
      progressPercentage,
    });

    res.json({
      message: "Location saved successfully",
      location: {
        id: locationRecord.id,
        latitude: locationRecord.latitude,
        longitude: locationRecord.longitude,
        timestamp: locationRecord.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving driver location:", error);
    res.status(500).json({
      message: "Error saving location",
      error: error.message,
    });
  }
}

/**
 * Cập nhật trạng thái học sinh (trang_thai_don)
 * PUT /api/tracking/schedule-student/:scheduleStudentId
 * Body: { trang_thai_don: "dihoc" | "vangmat" | "daxuong" }
 */
async function updateScheduleStudentStatus(req, res) {
  try {
    const { scheduleStudentId } = req.params;
    const { trang_thai_don } = req.body;

    // Validate input
    if (!scheduleStudentId || !trang_thai_don) {
      return res.status(400).json({
        message: "Schedule Student ID and status are required",
      });
    }

    // Các trạng thái hợp lệ
    const validStatuses = ["choxacnhan", "dihoc", "daxuong", "vangmat"];
    if (!validStatuses.includes(trang_thai_don)) {
      return res.status(400).json({
        message: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`,
      });
    }

    // Tìm ScheduleStudent record
    const scheduleStudent = await ScheduleStudent.findByPk(scheduleStudentId);

    if (!scheduleStudent) {
      return res.status(404).json({
        message: "Schedule Student not found",
      });
    }

    // Cập nhật trạng thái
    await scheduleStudent.update({ trang_thai_don });

    console.log(
      `✅ Updated student ${scheduleStudentId} status to ${trang_thai_don}`
    );

    res.json({
      message: "Student status updated successfully",
      data: {
        scheduleStudentId: scheduleStudent.id,
        studentId: scheduleStudent.student_id,
        trang_thai_don: scheduleStudent.trang_thai_don,
        updatedAt: scheduleStudent.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating schedule student status:", error);
    res.status(500).json({
      message: "Error updating student status",
      error: error.message,
    });
  }
}

// ✅ Reset tất cả trạng thái học sinh trong một schedule về 'choxacnhan'
async function resetScheduleStudentStatuses(req, res) {
  try {
    const { scheduleId } = req.params;

    // Validate input
    if (!scheduleId) {
      return res.status(400).json({
        message: "scheduleId is required",
      });
    }

    // Tìm tất cả ScheduleStudent với scheduleId này
    const scheduleStudents = await ScheduleStudent.findAll({
      where: { schedule_id: scheduleId },
    });

    if (!scheduleStudents || scheduleStudents.length === 0) {
      return res.status(404).json({
        message: "No students found for this schedule",
      });
    }

    // Update tất cả về 'choxacnhan'
    await ScheduleStudent.update(
      { trang_thai_don: "choxacnhan" },
      { where: { schedule_id: scheduleId } }
    );

    console.log(
      `✅ Reset ${scheduleStudents.length} students for schedule ${scheduleId}`
    );

    res.json({
      message: "All student statuses reset to default",
      totalReset: scheduleStudents.length,
      scheduleId: scheduleId,
    });
  } catch (error) {
    console.error("Error resetting schedule student statuses:", error);
    res.status(500).json({
      message: "Error resetting student statuses",
      error: error.message,
    });
  }
}

module.exports = {
  startTrip,
  endTrip,
  getCurrentLocation,
  getLocationHistory,
  getActiveTrips,
  getTripStatus,
  saveDriverLocation,
  updateScheduleStudentStatus,
  resetScheduleStudentStatuses,
};
