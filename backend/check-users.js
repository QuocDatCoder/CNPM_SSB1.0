const sequelize = require("./src/data/models").sequelize;

(async () => {
  try {
    const result = await sequelize.query("SELECT * FROM users LIMIT 1");
    if (result[0].length > 0) {
      console.log("Sample user columns:");
      console.log(Object.keys(result[0][0]));
      console.log("\nSample user data:");
      console.log(result[0][0]);
    } else {
      console.log("No users in database");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
})();
