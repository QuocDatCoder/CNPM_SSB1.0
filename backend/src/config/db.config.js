const { Sequelize } = require('sequelize');
require('dotenv').config(); // Đảm bảo đã load .env

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT || 3307; // <-- Thêm dòng này

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort, // <-- Thêm dòng này vào cấu hình
  dialect: 'mysql',
  logging: false
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối Database thành công!');
  } catch (error) {
    console.error('❌ Kết nối thất bại:', error.message);
  }
};

testConnection();
module.exports = sequelize;