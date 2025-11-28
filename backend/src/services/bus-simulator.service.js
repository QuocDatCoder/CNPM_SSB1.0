/**
 * Bus Simulator Service
 * Giả lập xe bus chạy trên tuyến đường và phát vị trí real-time
 */

const {
  Schedule,
  Bus,
  Route,
  RouteStop,
  Stop,
  LocationHistory,
  User,
} = require("../data/models");

// Lưu trữ các simulator đang chạy: { scheduleId: simulatorInstance }
const activeSimulators = new Map();

// Tính khoảng cách giữa 2 điểm (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Khoảng cách (km)
};

// Tính vị trí giữa 2 điểm dựa trên tỉ lệ tiến độ
const interpolateLocation = (lat1, lon1, lat2, lon2, progress) => {
  // progress: 0 -> 1 (0% -> 100% đường đi)
  return {
    latitude: lat1 + (lat2 - lat1) * progress,
    longitude: lon1 + (lon2 - lon1) * progress,
  };
};

/**
 * Tạo Simulator cho một chuyến đi
 */
class BusSimulator {
  constructor(scheduleId, io) {
    this.scheduleId = scheduleId;
    this.io = io;
    this.isRunning = false;
    this.currentStopIndex = 0;
    this.stops = [];
    this.schedule = null;
    this.bus = null;
    this.driverId = null;
    this.speed = 30; // km/h (tốc độ giả lập)
    this.updateInterval = 2000; // 2 giây (emit 1 vị trí mới)
    this.intervalId = null;
    this.totalDistance = 0; // Tổng quãng đường
    this.currentDistance = 0; // Quãng đường đã đi
    this.currentLat = null;
    this.currentLon = null;
  }

  /**
   * Khởi tạo simulator từ schedule
   */
  async initialize() {
    try {
      // Lấy thông tin schedule
      this.schedule = await Schedule.findByPk(this.scheduleId, {
        include: [
          { model: Route },
          { model: Bus },
          {
            model: User,
            as: "driver",
            attributes: ["id", "ho_ten", "so_dien_thoai"],
          },
        ],
      });

      if (!this.schedule) {
        throw new Error(`Schedule ${this.scheduleId} not found`);
      }

      this.bus = this.schedule.Bus;
      this.driverId = this.schedule.driver_id;

      // Lấy danh sách trạm của tuyến
      const routeStops = await RouteStop.findAll({
        where: { route_id: this.schedule.route_id },
        include: [{ model: Stop }],
        order: [["thu_tu", "ASC"]],
      });

      this.stops = routeStops.map((rs) => ({
        id: rs.Stop.id,
        ten_diem: rs.Stop.ten_diem,
        latitude: parseFloat(rs.Stop.latitude),
        longitude: parseFloat(rs.Stop.longitude),
        thu_tu: rs.thu_tu,
      }));

      if (this.stops.length < 2) {
        throw new Error("Route must have at least 2 stops");
      }

      // Tính tổng quãng đường
      for (let i = 0; i < this.stops.length - 1; i++) {
        const dist = calculateDistance(
          this.stops[i].latitude,
          this.stops[i].longitude,
          this.stops[i + 1].latitude,
          this.stops[i + 1].longitude
        );
        this.totalDistance += dist;
      }

      // Vị trí bắt đầu
      this.currentLat = this.stops[0].latitude;
      this.currentLon = this.stops[0].longitude;

      console.log(
        `✅ BusSimulator initialized for schedule ${this.scheduleId}:`,
        {
          bus: this.bus.bien_so_xe,
          route: this.schedule.Route.ten_tuyen,
          stops: this.stops.length,
          totalDistance: this.totalDistance.toFixed(2),
        }
      );

      return true;
    } catch (error) {
      console.error(`❌ Error initializing simulator: ${error.message}`);
      throw error;
    }
  }

  /**
   * Bắt đầu giả lập xe bus chạy
   */
  start() {
    if (this.isRunning) {
      console.warn(
        `⚠️ Simulator for schedule ${this.scheduleId} is already running`
      );
      return;
    }

    this.isRunning = true;
    this.currentStopIndex = 0;
    this.currentDistance = 0;

    console.log(`🚀 Starting simulator for schedule ${this.scheduleId}`);

    this.intervalId = setInterval(async () => {
      await this.updateLocation();
    }, this.updateInterval);
  }

  /**
   * Cập nhật vị trí xe bus
   */
  async updateLocation() {
    try {
      // Quãng đường đi được trong mỗi update (2 giây)
      const kmPerUpdate = (this.speed / 3600) * (this.updateInterval / 1000); // km = speed * (time in hours)
      this.currentDistance += kmPerUpdate;

      // Nếu đã chạy hết tuyến
      if (this.currentDistance >= this.totalDistance) {
        await this.finishRoute();
        return;
      }

      // Tìm stop hiện tại và stop tiếp theo
      let distanceCovered = 0;
      let foundSegment = false;

      for (let i = 0; i < this.stops.length - 1; i++) {
        const segmentDistance = calculateDistance(
          this.stops[i].latitude,
          this.stops[i].longitude,
          this.stops[i + 1].latitude,
          this.stops[i + 1].longitude
        );

        if (distanceCovered + segmentDistance >= this.currentDistance) {
          // Đang trên đoạn từ stop i đến stop i+1
          const distanceInSegment = this.currentDistance - distanceCovered;
          const progressInSegment = distanceInSegment / segmentDistance;

          const loc = interpolateLocation(
            this.stops[i].latitude,
            this.stops[i].longitude,
            this.stops[i + 1].latitude,
            this.stops[i + 1].longitude,
            progressInSegment
          );

          this.currentLat = loc.latitude;
          this.currentLon = loc.longitude;
          this.currentStopIndex = i;
          foundSegment = true;
          break;
        }

        distanceCovered += segmentDistance;
      }

      if (!foundSegment) {
        // Mặc định vị trí cuối cùng
        this.currentLat = this.stops[this.stops.length - 1].latitude;
        this.currentLon = this.stops[this.stops.length - 1].longitude;
        this.currentStopIndex = this.stops.length - 1;
      }

      // Lưu vào DB
      await LocationHistory.create({
        schedule_id: this.scheduleId,
        latitude: this.currentLat,
        longitude: this.currentLon,
      });

      // Broadcast vị trí cho admin, phụ huynh, tài xế
      this.broadcastLocation();
    } catch (error) {
      console.error(
        `❌ Error updating location for schedule ${this.scheduleId}:`,
        error.message
      );
    }
  }

  /**
   * Phát vị trí real-time qua WebSocket
   */
  broadcastLocation() {
    const progressPercentage =
      (this.currentDistance / this.totalDistance) * 100;

    const locationData = {
      scheduleId: this.scheduleId,
      busId: this.bus.id,
      bien_so_xe: this.bus.bien_so_xe,
      location: {
        latitude: this.currentLat,
        longitude: this.currentLon,
      },
      progressPercentage: parseFloat(progressPercentage.toFixed(1)),
      distanceCovered: parseFloat(this.currentDistance.toFixed(2)),
      totalDistance: parseFloat(this.totalDistance.toFixed(2)),
      currentStop: this.stops[this.currentStopIndex],
      timestamp: new Date().toISOString(),
    };

    // Phát cho admin
    this.io.to("admin-tracking").emit("bus-location-update", locationData);

    // Phát cho tài xế
    if (this.driverId) {
      this.io
        .to(`driver-${this.driverId}`)
        .emit("bus-location-update", locationData);
    }

    // Phát cho phụ huynh (các phụ huynh có con trên chuyến này)
    // TODO: Lấy danh sách phụ huynh từ ScheduleStudent
    this.io.to("parent-tracking").emit("bus-location-update", locationData);

    console.log(
      `📍 [Schedule ${this.scheduleId}] Location: ${this.currentLat.toFixed(
        6
      )}, ${this.currentLon.toFixed(6)} (${this.currentDistance.toFixed(
        2
      )}/${this.totalDistance.toFixed(
        2
      )} km) - Progress: ${progressPercentage.toFixed(1)}%`
    );
  }

  /**
   * Kết thúc chuyến đi
   */
  async finishRoute() {
    console.log(`✅ Route finished for schedule ${this.scheduleId}`);

    this.stop();

    try {
      // Cập nhật trạng thái schedule
      await Schedule.update(
        { trang_thai: "hoanthanh", thoi_gian_ket_thuc_thuc_te: new Date() },
        { where: { id: this.scheduleId } }
      );

      // Cập nhật trạng thái xe bus
      await Bus.update({ trang_thai: "Ngừng" }, { where: { id: this.bus.id } });

      // Cập nhật trạng thái tài xế
      if (this.driverId) {
        await User.update(
          { trang_thai_taixe: "tamdung" },
          { where: { id: this.driverId } }
        );
      }

      // Phát thông báo hoàn thành
      this.io.to("admin-tracking").emit("route-completed", {
        scheduleId: this.scheduleId,
        message: "Chuyến đi đã kết thúc",
        timestamp: new Date().toISOString(),
      });

      if (this.driverId) {
        this.io.to(`driver-${this.driverId}`).emit("route-completed", {
          scheduleId: this.scheduleId,
          message: "Chuyến đi của bạn đã kết thúc",
          timestamp: new Date().toISOString(),
        });
      }

      this.io.to("parent-tracking").emit("route-completed", {
        scheduleId: this.scheduleId,
        message: "Chuyến đi của con bạn đã kết thúc",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ Error finishing route: ${error.message}`);
    }
  }

  /**
   * Dừng giả lập
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log(`⏹️ Simulator stopped for schedule ${this.scheduleId}`);
  }

  /**
   * Tạm dừng giả lập
   */
  pause() {
    this.stop();
  }

  /**
   * Tiếp tục giả lập
   */
  resume() {
    this.start();
  }
}

/**
 * Start simulator cho một schedule
 */
const startBusSimulator = async (scheduleId, io) => {
  try {
    // Kiểm tra simulator đã chạy
    if (activeSimulators.has(scheduleId)) {
      console.warn(`⚠️ Simulator for schedule ${scheduleId} already running`);
      return activeSimulators.get(scheduleId);
    }

    // Tạo simulator mới
    const simulator = new BusSimulator(scheduleId, io);
    await simulator.initialize();
    simulator.start();

    // Lưu vào map
    activeSimulators.set(scheduleId, simulator);

    return simulator;
  } catch (error) {
    console.error(
      `❌ Error starting bus simulator for schedule ${scheduleId}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Stop simulator cho một schedule
 */
const stopBusSimulator = (scheduleId) => {
  const simulator = activeSimulators.get(scheduleId);
  if (simulator) {
    simulator.stop();
    activeSimulators.delete(scheduleId);
    console.log(`✅ Simulator stopped for schedule ${scheduleId}`);
  }
};

/**
 * Get active simulators
 */
const getActiveSimulators = () => {
  return Array.from(activeSimulators.keys());
};

/**
 * Get simulator status
 */
const getSimulatorStatus = (scheduleId) => {
  const simulator = activeSimulators.get(scheduleId);
  if (!simulator) return null;

  return {
    scheduleId,
    isRunning: simulator.isRunning,
    currentLocation: {
      latitude: simulator.currentLat,
      longitude: simulator.currentLon,
    },
    progress: (
      (simulator.currentDistance / simulator.totalDistance) *
      100
    ).toFixed(1),
    distanceCovered: simulator.currentDistance.toFixed(2),
    totalDistance: simulator.totalDistance.toFixed(2),
    currentStop: simulator.stops[simulator.currentStopIndex],
  };
};

module.exports = {
  startBusSimulator,
  stopBusSimulator,
  getActiveSimulators,
  getSimulatorStatus,
  BusSimulator,
};
