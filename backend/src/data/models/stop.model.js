const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const Stop = sequelize.define('Stop', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ten_diem: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  dia_chi: {
    type: DataTypes.STRING(255)
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  }
}, {
  tableName: 'Stops',
  timestamps: false
});

module.exports = Stop;