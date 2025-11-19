const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const Bus = sequelize.define('Bus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bien_so_xe: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  so_ghe: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  trang_thai: {
    type: DataTypes.ENUM('hoatdong', 'baotri', 'ngung'),
    defaultValue: 'hoatdong'
  }
}, {
  tableName: 'Buses',
  timestamps: false
});

module.exports = Bus;