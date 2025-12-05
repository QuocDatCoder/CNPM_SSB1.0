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
    console.log("\n✅ Testing Parent Dashboard Data for Parent ID 7...\n");

    const result = await sequelize.query(`
      SELECT 
        st.id as student_id,
        st.ho_ten,
        st.lop,
        GROUP_CONCAT(
          JSON_OBJECT(
            'schedule_id', ss.schedule_id,
            'route_id', s.route_id,
            'ten_tuyen', r.ten_tuyen,
            'gio_bat_dau', s.gio_bat_dau,
            'ngay_chay', s.ngay_chay,
            'tai_xe', u.ho_ten,
            'bien_so_xe', b.bien_so_xe,
            'khoang_cach', r.khoang_cach,
            'trang_thai_don', ss.trang_thai_don,
            'diem_dung', st2.ten_diem
          ) SEPARATOR ','
        ) as trips
      FROM Students st
      LEFT JOIN ScheduleStudents ss ON st.id = ss.student_id
      LEFT JOIN Schedules s ON ss.schedule_id = s.id
      LEFT JOIN Routes r ON s.route_id = r.id
      LEFT JOIN Users u ON s.driver_id = u.id
      LEFT JOIN Buses b ON s.bus_id = b.id
      LEFT JOIN Stops st2 ON ss.stop_id = st2.id
      WHERE st.parent_id = 7
      GROUP BY st.id, st.ho_ten, st.lop
    `);

    console.log("📊 STUDENT DATA:");
    result[0].forEach((row) => {
      console.log(`\n📌 Student: ${row.ho_ten} (Lớp ${row.lop})`);
      if (row.trips) {
        try {
          const trips = JSON.parse("[" + row.trips + "]");
          trips.forEach((trip, idx) => {
            console.log(`   Chuyến ${idx + 1}:`);
            console.log(`     - Ngày: ${trip.ngay_chay}`);
            console.log(`     - Tuyến: ${trip.ten_tuyen}`);
            console.log(`     - Tài xế: ${trip.tai_xe}`);
            console.log(`     - Xe: ${trip.bien_so_xe}`);
            console.log(`     - Điểm đón: ${trip.diem_dung}`);
          });
        } catch (e) {}
      } else {
        console.log("   ❌ No trips assigned");
      }
    });

    console.log("\n\n✅ Done!\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  }
})();
