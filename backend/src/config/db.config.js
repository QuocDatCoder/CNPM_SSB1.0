const { Sequelize } = require('sequelize');
require('dotenv').config(); // Đảm bảo đã load .env

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT || 3306; // <-- Thêm dòng này

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort, // <-- Thêm dòng này vào cấu hình
  dialect: 'mysql',
  logging: false
});

// ... (đoạn test connection giữ nguyên)

module.exports = sequelize;