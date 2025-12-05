const sequelize = require("./src/data/models").sequelize;

(async () => {
  try {
    const drivers = await sequelize.query(
      'SELECT id, driver_code, ho_ten, email FROM users WHERE vai_tro = "driver" LIMIT 3'
    );
    console.log("Sample drivers in database:");
    drivers[0].forEach((d) => {
      console.log(`  - ID: ${d.id}, Name: ${d.ho_ten}, Email: ${d.email}`);
    });
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
})();
