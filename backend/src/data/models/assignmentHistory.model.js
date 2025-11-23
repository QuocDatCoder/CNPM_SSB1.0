const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const AssignmentHistory = sequelize.define('AssignmentHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tuyen: {
    type: DataTypes.STRING,
    allowNull: false
  },
  thao_tac: {
    type: DataTypes.STRING,
    allowNull: false
  },
  thoi_gian: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW // Tự động lấy giờ hiện tại
  }
}, {
  tableName: 'AssignmentHistory',
  timestamps: false
});

module.exports = AssignmentHistory;