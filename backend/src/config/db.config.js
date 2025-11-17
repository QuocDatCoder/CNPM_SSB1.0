const { Sequelize } = require('sequelize');

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: 'mysql',
  logging: false // Tắt log SQL cho đỡ rối console
});

// 3. (Quan trọng) Hàm kiểm tra kết nối
async function testDbConnection() {
  try {
    await sequelize.authenticate(); // Thử kết nối
    console.log('✅ Kết nối Database (MySQL) thành công!');
  } catch (error) {
    console.error('❌ Không thể kết nối Database:', error);
  }
}

// 4. Gọi hàm kiểm tra
testDbConnection();

// 5. Xuất kết nối ra để các file Model có thể dùng
module.exports = sequelize;