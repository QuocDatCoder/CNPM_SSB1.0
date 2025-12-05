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

async function backfillScheduleStudents() {
  try {
    // Seed data tạo ScheduleStudents cho schedules lịch cũ (1-5)
    // Bây giờ tạo lại cho schedules mới (6-7) để ngày hôm nay có dữ liệu

    // Schedule 6 = Tuyến 1 (như schedule 1)
    const schedule6Students = [
      [6, 1, 5, "choxacnhan"],
      [6, 2, 5, "choxacnhan"],
      [6, 3, 14, "choxacnhan"],
      [6, 4, 14, "choxacnhan"],
      [6, 5, 2, "choxacnhan"],
      [6, 6, 2, "choxacnhan"],
      [6, 7, 2, "choxacnhan"],
    ];

    // Schedule 7 = Tuyến 3 (như schedule 3)
    const schedule7Students = [
      [7, 14, 7, "choxacnhan"],
      [7, 15, 7, "choxacnhan"],
      [7, 16, 8, "choxacnhan"],
      [7, 17, 8, "choxacnhan"],
      [7, 18, 10, "choxacnhan"],
      [7, 19, 10, "choxacnhan"],
      [7, 20, 7, "choxacnhan"],
      [7, 21, 8, "choxacnhan"],
    ];

    const allData = [...schedule6Students, ...schedule7Students];

    for (const [scheduleId, studentId, stopId, trangThai] of allData) {
      await sequelize.query(
        `
        INSERT INTO ScheduleStudents (schedule_id, student_id, stop_id, trang_thai_don)
        VALUES (?, ?, ?, ?)
      `,
        { replacements: [scheduleId, studentId, stopId, trangThai] }
      );
    }

    console.log("✅ Backfilled ScheduleStudents for schedules 6 & 7");

    // Verify
    const result = await sequelize.query(`
      SELECT s.id, COUNT(ss.id) as total_students
      FROM Schedules s
      LEFT JOIN ScheduleStudents ss ON s.id = ss.schedule_id
      WHERE s.ngay_chay = '2025-12-05'
      GROUP BY s.id
    `);

    console.log("\n✅ RESULT - Schedules for 2025-12-05:");
    console.table(result[0]);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

backfillScheduleStudents();
