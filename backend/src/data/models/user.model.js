const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  ho_ten: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  so_dien_thoai: {
    type: DataTypes.STRING(20),
    unique: true
  },
  vai_tro: {
    type: DataTypes.ENUM('admin', 'taixe', 'phuhuynh'),
    allowNull: false
  },
  // Thông tin phụ
  dia_chi: { type: DataTypes.STRING(255) },
  bang_lai: { type: DataTypes.STRING(50) },
  trang_thai_taixe: { type: DataTypes.ENUM('hoatdong', 'nghi', 'tamdung') },
  
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Users',
  timestamps: false // Tự quản lý created_at
});

module.exports = User;