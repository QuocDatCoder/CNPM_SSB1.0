const sequelize = require("./src/data/models").sequelize;

(async () => {
  try {
    const schedules = await sequelize.query(
      "SELECT COUNT(*) as count FROM schedules"
    );
    console.log("Total Schedules:", schedules[0][0].count);

    const schedulestudents = await sequelize.query(
      "SELECT COUNT(*) as count FROM schedulestudents"
    );
    console.log("Total Schedule Students:", schedulestudents[0][0].count);

    const students = await sequelize.query(
      "SELECT COUNT(*) as count FROM students"
    );
    console.log("Total Students:", students[0][0].count);

    const stops = await sequelize.query("SELECT COUNT(*) as count FROM stops");
    console.log("Total Stops:", stops[0][0].count);

    // Check schedule 1
    console.log("\n--- Schedule 1 Details ---");
    const sch1 = await sequelize.query("SELECT * FROM schedules WHERE id = 1");
    if (sch1[0].length > 0) {
      console.log("Schedule 1 found:", sch1[0][0]);
    } else {
      console.log("Schedule 1 NOT FOUND");
    }

    // Check students for schedule 1
    console.log("\n--- Students for Schedule 1 ---");
    const ss1 = await sequelize.query(
      "SELECT * FROM schedulestudents WHERE schedule_id = 1 LIMIT 10"
    );
    console.log("Found", ss1[0].length, "students");
    if (ss1[0].length > 0) {
      console.log("Sample:", ss1[0][0]);
    }

    // Check if there are any schedule_students
    const allss = await sequelize.query(
      "SELECT DISTINCT schedule_id FROM schedulestudents LIMIT 5"
    );
    console.log(
      "\n--- Schedules with students:",
      allss[0].map((r) => r.schedule_id)
    );
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
})();
