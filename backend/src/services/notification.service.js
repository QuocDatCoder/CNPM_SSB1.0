const Notification = require('../data/models/notification.model');
const Schedule = require('../data/models/schedule.model');
const ScheduleStudent = require('../data/models/scheduleStudent.model');
const Student = require('../data/models/student.model');
const User = require('../data/models/user.model');
const { Op } = require('sequelize');
// Import Socket Handler
const { sendRealTimeNotification } = require('../sockets/notification.handler');
class NotificationService {
  
  // Lấy tin nhắn theo bộ lọc (Tab: inbox, sent, trash, important...)
  async getMessages(userId, type, limit = 20, offset = 0) {
    let whereClause = {};

    switch (type) {
      case 'sent': // Đã gửi
        whereClause = { user_id_gui: userId, is_deleted: false };
        break;
      case 'important': // Quan trọng (Sao)
        whereClause = { 
          // Quan trọng có thể là tin đến HOẶC tin đi
          [Op.or]: [{ user_id_nhan: userId }, { user_id_gui: userId }],
          is_starred: true, 
          is_deleted: false 
        };
        break;
      case 'trash': // Thùng rác
        whereClause = { 
          [Op.or]: [{ user_id_nhan: userId }, { user_id_gui: userId }],
          is_deleted: true 
        };
        break;
      case 'scheduled': // Đã lên lịch
        whereClause = { 
          user_id_gui: userId, 
          thoi_gian_gui_du_kien: { [Op.gt]: new Date() }, // Thời gian > hiện tại
          is_deleted: false 
        };
        break;
      case 'inbox': // Hộp thư đến
      default:
        whereClause = { 
          user_id_nhan: userId, 
          is_deleted: false,
          // Chỉ lấy tin không hẹn giờ hoặc đã đến giờ gửi
          [Op.or]: [
            { thoi_gian_gui_du_kien: null },
            { thoi_gian_gui_du_kien: { [Op.lte]: new Date() } }
          ]
        };
        break;
    }

    return await Notification.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'nguoi_gui', attributes: ['id', 'ho_ten', 'vai_tro'] },
        { model: User, as: 'nguoi_nhan', attributes: ['id', 'ho_ten'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }

  // Gửi tin nhắn (Hỗ trợ gửi 1 người hoặc nhiều người)
// notification.service.js

  // Gửi tin nhắn (Hỗ trợ gửi 1 người hoặc nhiều người)
  async sendMessage({ senderId, recipientIds, subject, content, scheduleTime, type }) { 
    // 1. Tạo dữ liệu để lưu DB
    const dataToCreate = recipientIds.map(receiverId => ({
      user_id_gui: senderId,
      user_id_nhan: receiverId,
      tieu_de: subject,
      noi_dung: content,
      loai: type || 'tinnhan', 
      thoi_gian_gui: scheduleTime ? new Date(scheduleTime) : new Date(),
      created_at: new Date()
    }));

    // 2. Lưu vào Database
    const createdMessages = await Notification.bulkCreate(dataToCreate);

    // 3. BẮN SOCKET (QUAN TRỌNG: Thêm đoạn này vào)
    // Chỉ bắn socket nếu tin nhắn gửi NGAY (không phải tin hẹn giờ)
    if (!scheduleTime || new Date(scheduleTime) <= new Date()) {
        if (global.io) {
            createdMessages.forEach(msg => {
                const payload = {
                    id: msg.id,
                    sender: "Hệ thống/Tài xế", // Hoặc query tên người gửi nếu cần
                    subject: msg.tieu_de,
                    preview: msg.noi_dung,
                    date: msg.created_at,
                    type: msg.loai,
                    read: false
                };
                // Gọi hàm helper để bắn tin về client
                sendRealTimeNotification(global.io, msg.user_id_nhan, payload);
            });
        }
    }

    return createdMessages;
  }

  // Toggle Star (Đánh dấu sao)
  async toggleStar(id, userId) {
    const noti = await Notification.findOne({ 
        where: { id, [Op.or]: [{ user_id_nhan: userId }, { user_id_gui: userId }] } 
    });
    if (noti) {
      noti.is_starred = !noti.is_starred;
      await noti.save();
      return noti;
    }
    throw new Error('Message not found');
  }

  // Soft Delete (Chuyển vào thùng rác)
  async moveToTrash(id, userId) {
    const noti = await Notification.findOne({ 
        where: { id, [Op.or]: [{ user_id_nhan: userId }, { user_id_gui: userId }] } 
    });
    if (noti) {
      noti.is_deleted = true;
      await noti.save();
      return noti;
    }
    throw new Error('Message not found');
  }


  /**
   * Gửi cảnh báo từ Tài xế -> Phụ huynh & Admin
   * @param {Object} params
   */
  async sendDriverAlert({ driverId, alertType, message, toParents, toAdmin }) {
    const recipientIds = [];

    // 1. Nếu gửi cho Admin: Tìm tất cả user có vai trò 'admin'
    if (toAdmin) {
      const admins = await User.findAll({ where: { vai_tro: 'admin' }, attributes: ['id'] });
      admins.forEach(admin => recipientIds.push(admin.id));
    }

    // Loại bỏ ID trùng lặp
    const uniqueRecipients = [...new Set(recipientIds)];

    if (uniqueRecipients.length === 0) return { count: 0 };

    // 3. Tạo nội dung và Lưu DB
    // Map alertType sang tiêu đề dễ hiểu
    const titleMap = {
      'su-co-xe': '⚠️ CẢNH BÁO: Sự cố xe',
      'su-co-giao-thong': '⚠️ CẢNH BÁO: Tắc đường/Giao thông',
      'su-co-y-te': '🚑 CẢNH BÁO: Sự cố y tế',
      'khac': '⚠️ Thông báo từ tài xế'
    };
    const subject = titleMap[alertType] || 'Thông báo khẩn cấp';

    const dataToCreate = uniqueRecipients.map(receiverId => ({
      user_id_gui: driverId,
      user_id_nhan: receiverId,
      tieu_de: subject,
      noi_dung: message,
      loai: 'canhbao_suco', // Hoặc enum tương ứng trong DB
      created_at: new Date()
    }));

    const createdNotifications = await Notification.bulkCreate(dataToCreate);

 
    if (global.io) {
      createdNotifications.forEach(noti => {
        const payload = {
          id: noti.id,
          sender: "Tài xế",
          subject: noti.tieu_de,
          preview: noti.noi_dung,
          date: noti.created_at,
          type: 'alert', // Đánh dấu để frontend hiện màu đỏ
          read: false
        };
        sendRealTimeNotification(global.io, noti.user_id_nhan, payload);
      });
    }

    return { count: uniqueRecipients.length };
  }
}

module.exports = new NotificationService();