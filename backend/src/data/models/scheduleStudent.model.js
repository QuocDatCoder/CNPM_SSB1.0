const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const ScheduleStudent = sequelize.define('ScheduleStudent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  schedule_id: { type: DataTypes.INTEGER, allowNull: false },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  stop_id: { type: DataTypes.INTEGER, allowNull: false },
  
  trang_thai_don: {
    type: DataTypes.ENUM('choxacnhan', 'dihoc', 'vangmat', 'daxuong'),
    defaultValue: 'choxacnhan'
  },
  
  thoi_gian_don_thuc_te: { type: DataTypes.DATE }
}, {
  tableName: 'ScheduleStudents',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['schedule_id', 'student_id'],
      name: 'student_on_schedule_unique'
    }
  ]
});

module.exports = ScheduleStudent;