/**
 * Admin Service - Tổng hợp các service cho Admin
 * Sử dụng các service riêng lẻ
 */

import BusService from "./bus.service";
import DriverService from "./driver.service";
import RouteService from "./route.service";
import ScheduleService from "./schedule.service";

const AdminService = {
  // Bus Management
  buses: {
    getAll: () => BusService.getAllBuses(),
    create: (data) => BusService.createBus(data),
    update: (id, data) => BusService.updateBus(id, data),
    delete: (id) => BusService.deleteBus(id),
  },

  // Driver Management
  drivers: {
    getAll: () => DriverService.getAllDrivers(),
    getById: (id) => DriverService.getDriverById(id),
  },

  // Route Management
  routes: {
    getAll: () => RouteService.getAllRoutes(),
    getById: (id) => RouteService.getRouteById(id),
    getStops: () => RouteService.getAllStops(),
  },

  // Schedule Management
  schedules: {
    getAll: () => ScheduleService.getAllSchedules(),
    create: (data) => ScheduleService.createSchedule(data),
    update: (id, data) => ScheduleService.updateSchedule(id, data),
    delete: (id) => ScheduleService.deleteSchedule(id),
    getDriverWeekSchedule: (driverId) =>
      ScheduleService.getDriverWeekSchedule(driverId),
    getHistory: (filters) => ScheduleService.getAssignmentHistory(filters),
  },
};

export default AdminService;
