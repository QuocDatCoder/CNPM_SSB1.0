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

(async () => {
  try {
    const result = await sequelize.query(`
      SELECT st.id as student_id, st.ho_ten, ss.schedule_id, s.ngay_chay, r.ten_tuyen, u.ho_ten as tai_xe, b.bien_so_xe
      FROM Students st
      JOIN ScheduleStudents ss ON st.id = ss.student_id
      JOIN Schedules s ON ss.schedule_id = s.id
      JOIN Routes r ON s.route_id = r.id
      JOIN Users u ON s.driver_id = u.id
      JOIN Buses b ON s.bus_id = b.id
      WHERE st.parent_id = 7 AND s.ngay_chay = '2025-12-05'
    `);
    console.log("\n✅ Schedule for Parent 7 (Tèo):");
    console.table(result[0]);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
