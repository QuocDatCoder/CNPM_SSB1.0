const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  route_id: { type: DataTypes.INTEGER, allowNull: false },
  driver_id: { type: DataTypes.INTEGER, allowNull: false },
  bus_id: { type: DataTypes.INTEGER, allowNull: false },
  
  ngay_chay: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  trang_thai: {
    type: DataTypes.ENUM('chuabatdau', 'dangchay', 'hoanthanh', 'huy'),
    defaultValue: 'chuabatdau'
  },
  thoi_gian_bat_dau_thuc_te: { type: DataTypes.DATE },
  thoi_gian_ket_thuc_thuc_te: { type: DataTypes.DATE }
}, {
  tableName: 'Schedules',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['driver_id', 'ngay_chay'], name: 'driver_day_unique' },
    { unique: true, fields: ['bus_id', 'ngay_chay'], name: 'bus_day_unique' }
  ]
});

module.exports = Schedule;