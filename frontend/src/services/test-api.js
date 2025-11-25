// Test API Connection
// Chạy file này để test kết nối với backend

import BusService from "./bus.service";
import DriverService from "./driver.service";
import RouteService from "./route.service";
import ScheduleService from "./schedule.service";

const TestAPI = {
  async testBuses() {
    console.log("=== Testing Bus API ===");
    try {
      const buses = await BusService.getAllBuses();
      console.log("✅ Buses:", buses);
      return buses;
    } catch (error) {
      console.error("❌ Bus API Error:", error.message);
      return null;
    }
  },

  async testDrivers() {
    console.log("\n=== Testing Driver API ===");
    try {
      const drivers = await DriverService.getAllDrivers();
      console.log("✅ Drivers:", drivers);
      return drivers;
    } catch (error) {
      console.error("❌ Driver API Error:", error.message);
      return null;
    }
  },

  async testRoutes() {
    console.log("\n=== Testing Route API ===");
    try {
      const routes = await RouteService.getAllRoutes();
      console.log("✅ Routes:", routes);
      return routes;
    } catch (error) {
      console.error("❌ Route API Error:", error.message);
      return null;
    }
  },

  async testSchedules() {
    console.log("\n=== Testing Schedule API ===");
    try {
      const schedules = await ScheduleService.getAllSchedules();
      console.log("✅ Schedules:", schedules);
      return schedules;
    } catch (error) {
      console.error("❌ Schedule API Error:", error.message);
      return null;
    }
  },

  async testAll() {
    console.log("🚀 Starting API Connection Tests...\n");

    await this.testBuses();
    await this.testDrivers();
    await this.testRoutes();
    await this.testSchedules();

    console.log("\n✨ Test completed!");
  },
};

export default TestAPI;

// Uncomment để test trong console
// TestAPI.testAll();
