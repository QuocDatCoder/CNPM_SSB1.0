const sequelize = require("./src/data/models").sequelize;

(async () => {
  try {
    const result = await sequelize.query("SELECT DISTINCT vai_tro FROM users");
    console.log(
      "Available vai_tro values:",
      result[0].map((r) => r.vai_tro)
    );

    const users = await sequelize.query(
      "SELECT id, username, ho_ten, vai_tro FROM users LIMIT 15"
    );
    console.log("\nAll users:");
    users[0].forEach((u) => {
      console.log(
        `  - ID: ${u.id}, Username: ${u.username}, Name: ${u.ho_ten}, Role: ${u.vai_tro}`
      );
    });
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
})();
