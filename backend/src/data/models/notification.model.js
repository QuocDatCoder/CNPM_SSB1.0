const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');
const User = require('./user.model'); // Đảm bảo bạn đã có model User

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id_gui: { type: DataTypes.INTEGER, allowNull: true },
  user_id_nhan: { type: DataTypes.INTEGER, allowNull: false },
  
  // Các trường mới thêm
  tieu_de: { type: DataTypes.STRING, allowNull: true },
  noi_dung: { type: DataTypes.TEXT, allowNull: false },
  
  loai: { type: DataTypes.STRING, defaultValue: 'tinnhan' }, // Đã đổi thành String
  
  da_doc: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_starred: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  thoi_gian_gui_du_kien: { type: DataTypes.DATE, allowNull: true },
  
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'Notifications',
  timestamps: false
});

// Thiết lập quan hệ để lấy tên người gửi/nhận
Notification.belongsTo(User, { as: 'nguoi_gui', foreignKey: 'user_id_gui' });
Notification.belongsTo(User, { as: 'nguoi_nhan', foreignKey: 'user_id_nhan' });

module.exports = Notification;