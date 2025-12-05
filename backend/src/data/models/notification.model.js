// src/data/models/notification.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id_gui: { type: DataTypes.INTEGER, allowNull: true },
  user_id_nhan: { type: DataTypes.INTEGER, allowNull: false },
  tieu_de: { type: DataTypes.STRING, allowNull: true },
  noi_dung: { type: DataTypes.TEXT, allowNull: false },
  loai: { type: DataTypes.STRING, defaultValue: 'tinnhan' },
  da_doc: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_starred: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  thoi_gian_gui_du_kien: { type: DataTypes.DATE, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'Notifications',
  timestamps: false
});

module.exports = Notification; 
// KHÔNG require User ở đây
// KHÔNG define quan hệ ở đây