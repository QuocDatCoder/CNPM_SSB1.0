// src/services/notification.service.js

const { Op } = require('sequelize');
const { Notification, User, Student, Schedule, Route, RouteStop } = require('../data/models');
const { sendRealTimeNotification } = require('../sockets/notification.handler');

class NotificationService {

  // ... (Các hàm getMessages, sendMessage, toggleStar, moveToTrash GIỮ NGUYÊN) ...

  async getMessages(userId, type, limit = 20, offset = 0) {
    let whereClause = {};
    switch (type) {
      case 'sent': whereClause = { user_id_gui: userId, is_deleted: false }; break;
      case 'important': whereClause = { [Op.or]: [{ user_id_nhan: userId }, { user_id_gui: userId }], is_starred: true, is_deleted: false }; break;
      case 'trash': whereClause = { [Op.or]: [{ user_id_nhan: userId }, { user_id_gui: userId }], is_deleted: true }; break;
      case 'scheduled': whereClause = { user_id_gui: userId, thoi_gian_gui_du_kien: { [Op.gt]: new Date() }, is_deleted: false }; break;
      case 'inbox': default: whereClause = { user_id_nhan: userId, is_deleted: false, [Op.or]: [{ thoi_gian_gui_du_kien: null }, { thoi_gian_gui_du_kien: { [Op.lte]: new Date() } }] }; break;
    }
    return await Notification.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'nguoi_gui', attributes: ['id', 'ho_ten', 'vai_tro'] }, { model: User, as: 'nguoi_nhan', attributes: ['id', 'ho_ten'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit), offset: parseInt(offset)
    });
  }

  async sendMessage({ senderId, recipientIds, subject, content, scheduleTime, type }) {
    const dataToCreate = recipientIds.map(receiverId => ({
      user_id_gui: senderId, user_id_nhan: receiverId, tieu_de: subject, noi_dung: content, loai: type || 'tinnhan',
      thoi_gian_gui_du_kien: scheduleTime ? new Date(scheduleTime) : null, created_at: new Date()
    }));
    const createdMessages = await Notification.bulkCreate(dataToCreate);
    if (!scheduleTime || new Date(scheduleTime) <= new Date()) {
      if (global.io) {
        const senderInfo = await User.findByPk(senderId, { attributes: ['ho_ten', 'vai_tro'] });
        const senderName = senderInfo ? senderInfo.ho_ten : "Hệ thống";
        createdMessages.forEach(msg => {
          sendRealTimeNotification(global.io, msg.user_id_nhan, {
            id: msg.id, sender: senderName, subject: msg.tieu_de, preview: msg.noi_dung, date: msg.created_at, type: msg.loai, read: false
          });
        });
      }
    }
    return createdMessages;
  }

  async toggleStar(id, userId) {
    const noti = await Notification.findOne({ where: { id, [Op.or]: [{ user_id_nhan: userId }, { user_id_gui: userId }] } });
    if (noti) { noti.is_starred = !noti.is_starred; await noti.save(); return noti; }
    throw new Error('Không tìm thấy tin nhắn');
  }

  async moveToTrash(id, userId) {
    const noti = await Notification.findOne({ where: { id, [Op.or]: [{ user_id_nhan: userId }, { user_id_gui: userId }] } });
    if (noti) { noti.is_deleted = true; await noti.save(); return noti; }
    throw new Error('Không tìm thấy tin nhắn');
  }

  // =========================================================================
  //  CÁC HÀM ĐÃ CẬP NHẬT LOGIC LỌC THEO TUYẾN
  // =========================================================================

  /**
   * 1. ADMIN: Lấy danh sách Tài xế
   * - Nếu không truyền routeId: Lấy tất cả tài xế.
   * - Nếu truyền routeId: Lấy các tài xế có phân công (Schedule) trong tuyến đó.
   */
  async getAllDriversByAllRoute(routeId = null) {
    let whereClause = {
      vai_tro: 'taixe',
      // trang_thai_taixe: 'hoatdong' // (Đã bỏ theo yêu cầu trước để lấy được nhiều dữ liệu hơn khi test)
    };

    if (routeId) {
      // Tìm các tài xế có lịch chạy thuộc tuyến này
      const schedules = await Schedule.findAll({
        where: { route_id: routeId },
        attributes: ['driver_id']
      });
      
      // Lấy danh sách ID tài xế duy nhất, loại bỏ null
      const driverIds = [...new Set(schedules.map(s => s.driver_id).filter(id => id))];

      if (driverIds.length === 0) {
        return []; // Không có tài xế nào được phân công tuyến này
      }

      // Thêm điều kiện lọc ID
      whereClause.id = { [Op.in]: driverIds };
    }

    return await User.findAll({
      where: whereClause,
      attributes: ['id', 'ho_ten', 'so_dien_thoai', 'driver_code', 'email']
    });
  }

  /**
   * 2. ADMIN: Lấy danh sách Phụ huynh
   * - Nếu không truyền routeId: Lấy tất cả phụ huynh có con đi xe bất kỳ.
   * - Nếu truyền routeId: Lấy phụ huynh có con đăng ký điểm dừng thuộc tuyến đó.
   */
// src/services/notification.service.js

  async getAllParentsByAllRoute(routeId = null) {
    let studentWhereClause = {};

    // Kiểm tra chặt chẽ: routeId phải tồn tại và không phải chuỗi rỗng hoặc "undefined"
    const isValidRoute = routeId && routeId !== "" && routeId !== "undefined" && routeId !== "null";

    if (isValidRoute) {
      console.log("🔍 Đang lọc phụ huynh theo Route ID:", routeId);

      // 1. Tìm tất cả điểm dừng của tuyến này
      const routeStops = await RouteStop.findAll({
        where: { route_id: routeId },
        attributes: ['id']
      });
      
      const stopIds = routeStops.map(rs => rs.id);

      // Nếu tuyến không có điểm dừng nào -> Chắc chắn không có học sinh -> Trả về rỗng ngay
      if (stopIds.length === 0) {
        return []; 
      }

      // 2. Lọc học sinh
      studentWhereClause = {
        [Op.or]: [
          { default_route_stop_id_di: { [Op.in]: stopIds } },
          { default_route_stop_id_ve: { [Op.in]: stopIds } }
        ]
      };
    } else {
      console.log("⚠️ Không có Route ID -> Lấy danh sách TOÀN BỘ phụ huynh");
      // Logic cũ: Lấy tất cả
      studentWhereClause = {
        [Op.or]: [
          { default_route_stop_id_di: { [Op.ne]: null } },
          { default_route_stop_id_ve: { [Op.ne]: null } }
        ]
      };
    }

    return await User.findAll({
      where: { vai_tro: 'phuhuynh' },
      include: [{
        model: Student,
        as: 'children',
        required: true, // Inner Join: Chỉ lấy PH có con thỏa mãn điều kiện lọc
        where: studentWhereClause, 
        attributes: []
      }],
      attributes: ['id', 'ho_ten', 'so_dien_thoai', 'parent_code', 'email'],
      group: ['User.id']
    });
  }

  /**
   * 3. DRIVER: Lấy danh sách Phụ huynh thuộc các tuyến mà Tài xế phụ trách (Hôm nay)
   * (Giữ nguyên logic cũ)
   */
  async getParentsByDriverRoute(driverId) {
    const today = new Date().toLocaleDateString('en-CA');
    const schedules = await Schedule.findAll({
      where: { driver_id: driverId, ngay_chay: today },
      attributes: ['route_id']
    });

    if (!schedules.length) return [];
    const routeIds = schedules.map(s => s.route_id);

    const routeStops = await RouteStop.findAll({
      where: { route_id: { [Op.in]: routeIds } },
      attributes: ['id']
    });
    const routeStopIds = routeStops.map(rs => rs.id);
    if (!routeStopIds.length) return [];

    return await User.findAll({
      where: { vai_tro: 'phuhuynh' },
      include: [{
        model: Student, as: 'children', required: true,
        where: {
          [Op.or]: [
            { default_route_stop_id_di: { [Op.in]: routeStopIds } },
            { default_route_stop_id_ve: { [Op.in]: routeStopIds } }
          ]
        },
        attributes: []
      }],
      attributes: ['id', 'ho_ten', 'so_dien_thoai', 'parent_code'],
      group: ['User.id']
    });
  }

  // ... (Hàm sendDriverAlert GIỮ NGUYÊN) ...
  async sendDriverAlert({ driverId, alertType, message, toParents, toAdmin }) {
    let recipientIds = new Set();
    if (toAdmin) {
      const admins = await User.findAll({ where: { vai_tro: 'admin' }, attributes: ['id'] });
      admins.forEach(ad => recipientIds.add(ad.id));
    }
    if (toParents) {
      const parents = await this.getParentsByDriverRoute(driverId);
      parents.forEach(p => recipientIds.add(p.id));
    }
    const finalRecipientIds = Array.from(recipientIds);
    if (finalRecipientIds.length === 0) return { count: 0, message: "Không tìm thấy người nhận phù hợp." };

    const titleMap = {
      'su-co-xe': '⚠️ SỰ CỐ XE - CẦN CHÚ Ý',
      'su-co-giao-thong': '⚠️ TẮC ĐƯỜNG/GIAO THÔNG',
      'su-co-y-te': '🚑 SỰ CỐ Y TẾ KHẨN CẤP',
      'khac': '⚠️ THÔNG BÁO TỪ TÀI XẾ'
    };
    const subject = titleMap[alertType] || '⚠️ CẢNH BÁO KHẨN CẤP';

    const dataToCreate = finalRecipientIds.map(receiverId => ({
      user_id_gui: driverId, user_id_nhan: receiverId, tieu_de: subject, noi_dung: message, loai: 'canhbao', created_at: new Date()
    }));
    const createdNotifications = await Notification.bulkCreate(dataToCreate);
    if (global.io) {
      const driver = await User.findByPk(driverId, { attributes: ['ho_ten'] });
      const driverName = driver ? driver.ho_ten : "Tài xế";
      createdNotifications.forEach(noti => {
        sendRealTimeNotification(global.io, noti.user_id_nhan, {
          id: noti.id, sender: driverName, subject: noti.tieu_de, preview: noti.noi_dung, date: noti.created_at, type: 'alert', read: false
        });
      });
    }
    return { count: finalRecipientIds.length };
  }
}

module.exports = new NotificationService();