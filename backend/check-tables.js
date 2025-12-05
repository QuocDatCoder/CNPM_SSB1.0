const sequelize = require("./src/data/models").sequelize;

(async () => {
  try {
    const tables = await sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'smart_bus_tracking_optimized'"
    );
    console.log("Tables in database:");
    tables[0].forEach((t) => console.log("  -", t.TABLE_NAME));
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
})();
