// src/services/notification.service.js

const { Op } = require('sequelize');
const { Notification, User, Student, Schedule, Route } = require('../data/models'); // Import từ index.js để nhận đủ mối quan hệ
const { sendRealTimeNotification } = require('../sockets/notification.handler');

class NotificationService {

  /**
   * Lấy danh sách tin nhắn (Dùng chung cho Admin, Driver, Parent)
   * @param {number} userId - ID người dùng hiện tại
   * @param {string} type - inbox | sent | important | trash | scheduled
   * @param {number} limit 
   * @param {number} offset 
   */
  async getMessages(userId, type, limit = 20, offset = 0) {
    let whereClause = {};

    switch (type) {
      case 'sent': // Tin đã gửi
        whereClause = { user_id_gui: userId, is_deleted: false };
        break;
      case 'important': // Tin đánh dấu sao
        whereClause = { 
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
      case 'scheduled': // Tin hẹn giờ (chưa gửi)
        whereClause = { 
          user_id_gui: userId, 
          thoi_gian_gui_du_kien: { [Op.gt]: new Date() }, 
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
        { model: User, as: 'nguoi_gui', attributes: ['id', 'ho_ten', 'vai_tro'] }, // Alias khớp với model
        { model: User, as: 'nguoi_nhan', attributes: ['id', 'ho_ten'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }

  /**
   * Gửi tin nhắn thông thường (Dùng cho Admin gửi Driver/Parent hoặc Parent gửi Admin)
   * Frontend chịu trách nhiệm lọc ra danh sách recipientIds
   */
  async sendMessage({ senderId, recipientIds, subject, content, scheduleTime, type }) { 
    // 1. Chuẩn bị dữ liệu
    const dataToCreate = recipientIds.map(receiverId => ({
      user_id_gui: senderId,
      user_id_nhan: receiverId,
      tieu_de: subject,
      noi_dung: content,
      loai: type || 'tinnhan', 
      thoi_gian_gui_du_kien: scheduleTime ? new Date(scheduleTime) : null,
      created_at: new Date()
    }));

    // 2. Lưu vào DB
    const createdMessages = await Notification.bulkCreate(dataToCreate);

    // 3. Bắn Socket (Chỉ khi gửi ngay)
    if (!scheduleTime || new Date(scheduleTime) <= new Date()) {
      if (global.io) {
        // Lấy thông tin người gửi để hiển thị realtime đẹp hơn
        const senderInfo = await User.findByPk(senderId, { attributes: ['ho_ten', 'vai_tro'] });
        const senderName = senderInfo ? senderInfo.ho_ten : "Hệ thống";

        createdMessages.forEach(msg => {
          const payload = {
            id: msg.id,
            sender: senderName,
            subject: msg.tieu_de,
            preview: msg.noi_dung,
            date: msg.created_at,
            type: msg.loai,
            read: false
          };
          sendRealTimeNotification(global.io, msg.user_id_nhan, payload);
        });
      }
    }

    return createdMessages;
  }

  /**
   * Đánh dấu sao tin nhắn
   */
  async toggleStar(id, userId) {
    const noti = await Notification.findOne({ 
        where: { id, [Op.or]: [{ user_id_nhan: userId }, { user_id_gui: userId }] } 
    });
    if (noti) {
      noti.is_starred = !noti.is_starred;
      await noti.save();
      return noti;
    }
    throw new Error('Không tìm thấy tin nhắn');
  }

  /**
   * Chuyển vào thùng rác (Soft delete)
   */
  async moveToTrash(id, userId) {
    const noti = await Notification.findOne({ 
        where: { id, [Op.or]: [{ user_id_nhan: userId }, { user_id_gui: userId }] } 
    });
    if (noti) {
      noti.is_deleted = true;
      await noti.save();
      return noti;
    }
    throw new Error('Không tìm thấy tin nhắn');
  }

  /**
   * Xử lý Cảnh báo từ Tài xế (Driver Alert)
   * Logic: Gửi cho Admin + Phụ huynh có con thuộc tuyến xe tài xế chạy hôm nay
   */
  async sendDriverAlert({ driverId, alertType, message, toParents, toAdmin }) {
    let recipientIds = new Set(); // Dùng Set để tránh trùng lặp ID

    // --- BƯỚC 1: Lấy danh sách Admin (Nếu chọn gửi Admin) ---
    if (toAdmin) {
      const admins = await User.findAll({ 
        where: { vai_tro: 'admin' }, // Giả sử vai_tro là 'admin'
        attributes: ['id'] 
      });
      admins.forEach(ad => recipientIds.add(ad.id));
    }

    // --- BƯỚC 2: Lấy danh sách Phụ huynh (Nếu chọn gửi Phụ huynh) ---
    // Logic: Tìm lịch chạy hôm nay -> Lấy Routes -> Lấy Học sinh -> Lấy Phụ huynh
    if (toParents) {
      // 2.1. Lấy ngày hiện tại (YYYY-MM-DD)
      const today = new Date().toLocaleDateString('en-CA'); // Định dạng khớp với DATEONLY của MySQL

      // 2.2. Tìm tất cả các chuyến (Schedule) của tài xế trong hôm nay
      const schedules = await Schedule.findAll({
        where: {
          driver_id: driverId,
          ngay_chay: today
        },
        attributes: ['route_id']
      });

      // Nếu có lịch chạy
      if (schedules.length > 0) {
        const routeIds = schedules.map(s => s.route_id);

        // 2.3. Tìm tất cả học sinh thuộc các tuyến này
        const students = await Student.findAll({
          where: {
            current_route_id: { [Op.in]: routeIds },
            parent_id: { [Op.ne]: null } // Chỉ lấy HS đã có liên kết phụ huynh
          },
          attributes: ['parent_id']
        });

        // 2.4. Thêm parent_id vào danh sách nhận
        students.forEach(stu => recipientIds.add(stu.parent_id));
      }
    }

    const finalRecipientIds = Array.from(recipientIds); // Chuyển Set về Array

    if (finalRecipientIds.length === 0) {
      return { count: 0, message: "Không tìm thấy người nhận phù hợp." };
    }

    // --- BƯỚC 3: Tạo nội dung tiêu đề dựa trên loại cảnh báo ---
    const titleMap = {
      'su-co-xe': '⚠️ SỰ CỐ XE - CẦN CHÚ Ý',
      'su-co-giao-thong': '⚠️ TẮC ĐƯỜNG/GIAO THÔNG',
      'su-co-y-te': '🚑 SỰ CỐ Y TẾ KHẨN CẤP',
      'khac': '⚠️ THÔNG BÁO TỪ TÀI XẾ'
    };
    const subject = titleMap[alertType] || '⚠️ CẢNH BÁO KHẨN CẤP';

    // --- BƯỚC 4: Lưu DB ---
    const dataToCreate = finalRecipientIds.map(receiverId => ({
      user_id_gui: driverId,
      user_id_nhan: receiverId,
      tieu_de: subject,
      noi_dung: message,
      loai: 'canhbao', // Đánh dấu là loại cảnh báo
      created_at: new Date()
    }));

    const createdNotifications = await Notification.bulkCreate(dataToCreate);

    // --- BƯỚC 5: Bắn Socket Realtime ---
    if (global.io) {
      // Lấy tên tài xế để hiển thị
      const driver = await User.findByPk(driverId, { attributes: ['ho_ten'] });
      const driverName = driver ? driver.ho_ten : "Tài xế";

      createdNotifications.forEach(noti => {
        const payload = {
          id: noti.id,
          sender: driverName,
          subject: noti.tieu_de,
          preview: noti.noi_dung,
          date: noti.created_at,
          type: 'alert', // Frontend sẽ dựa vào type này để hiện màu đỏ/icon cảnh báo
          read: false
        };
        sendRealTimeNotification(global.io, noti.user_id_nhan, payload);
      });
    }

    return { count: finalRecipientIds.length };
  }
}

module.exports = new NotificationService();