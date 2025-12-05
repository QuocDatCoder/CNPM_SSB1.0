// Test script using Sequelize to simulate API call
const { Sequelize } = require("sequelize");
require("dotenv").config();

// Import models
const initModels = require("./src/data/models");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

const { Student, ScheduleStudent, Schedule, Route, Bus, User, Stop } =
  initModels(sequelize);

// Call the service function directly
const scheduleService = require("./src/services/schedule.service");

(async () => {
  try {
    console.log("\n🔍 Testing getParentDashboardInfo for Parent ID 7...\n");
    const result = await scheduleService.getParentDashboardInfo(7);

    console.log("\n✅ RESULT:");
    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
