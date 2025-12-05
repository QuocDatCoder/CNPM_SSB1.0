const { Sequelize } = require("sequelize");
require("dotenv").config();

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

async function checkDB() {
  try {
    const result = await sequelize.query(`
      SELECT s.id, s.ngay_chay, r.ten_tuyen, u.ho_ten as tai_xe, b.bien_so_xe
      FROM Schedules s
      LEFT JOIN Routes r ON s.route_id = r.id
      LEFT JOIN Users u ON s.driver_id = u.id
      LEFT JOIN Buses b ON s.bus_id = b.id
      ORDER BY s.ngay_chay DESC
      LIMIT 10
    `);
    console.log("\n📋 SCHEDULES IN DATABASE:");
    console.table(result[0]);

    // Check ScheduleStudents for each schedule
    const scheduleIds = result[0].map((s) => s.id);
    for (const schedId of scheduleIds) {
      const ssResult = await sequelize.query(
        `
        SELECT COUNT(*) as total FROM ScheduleStudents WHERE schedule_id = ?
      `,
        { replacements: [schedId], type: Sequelize.QueryTypes.SELECT }
      );
      console.log(`  Schedule ${schedId}: ${ssResult[0].total} students`);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

checkDB();
