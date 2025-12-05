const sequelize = require("./src/data/models").sequelize;

(async () => {
  try {
    const query = "DESCRIBE students";
    const result = await sequelize.query(query);
    console.log("Students table structure:");
    result[0].forEach((r) => console.log("  -", r.Field, "(" + r.Type + ")"));

    console.log("\nSample student:");
    const sample = await sequelize.query("SELECT * FROM students LIMIT 1");
    console.log(JSON.stringify(sample[0][0], null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
})();
