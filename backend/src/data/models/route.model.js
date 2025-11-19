const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const Route = sequelize.define('Route', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ten_tuyen: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  mo_ta: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'Routes',
  timestamps: false
});

module.exports = Route;