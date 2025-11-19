const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id_gui: { type: DataTypes.INTEGER, allowNull: true },
  user_id_nhan: { type: DataTypes.INTEGER, allowNull: false },
  schedule_id: { type: DataTypes.INTEGER, allowNull: true },
  noi_dung: { type: DataTypes.TEXT, allowNull: false },
  loai: {
    type: DataTypes.ENUM('canhbao_sapden', 'canhbao_trexe', 'suco_taixe', 'tinnhan'),
    allowNull: false
  },
  da_doc: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Notifications',
  timestamps: false
});

module.exports = Notification;