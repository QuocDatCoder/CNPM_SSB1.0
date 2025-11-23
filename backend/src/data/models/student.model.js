const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ho_ten: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  lop: {
    type: DataTypes.STRING(50)
  },
  ngay_sinh: {
    type: DataTypes.DATEONLY, // Chỉ lưu ngày
    allowNull: true
  },
  gioi_tinh: {
    type: DataTypes.ENUM('Nam', 'Nữ'),
    defaultValue: 'Nam'
  },
  gvcn: { // Giáo viên chủ nhiệm
    type: DataTypes.STRING(150),
    allowNull: true
  },
  // -----------------------------
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  default_stop_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  default_route_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'Students',
  timestamps: false
});

module.exports = Student;