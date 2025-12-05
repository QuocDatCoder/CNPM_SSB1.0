const sequelize = require("./src/data/models").sequelize;

(async () => {
  try {
    const query = "DESCRIBE schedulestudents";
    const result = await sequelize.query(query);
    console.log("ScheduleStudents table structure:");
    result[0].forEach((r) => console.log("  -", r.Field, "(" + r.Type + ")"));

    console.log("\nSample schedule student:");
    const sample = await sequelize.query(
      "SELECT * FROM schedulestudents LIMIT 1"
    );
    console.log(JSON.stringify(sample[0][0], null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
})();
