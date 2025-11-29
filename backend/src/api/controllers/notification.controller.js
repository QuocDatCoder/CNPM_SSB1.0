const notificationService = require('../../services/notification.service');

// 1. Lấy danh sách tin nhắn (Đã mapping dữ liệu cho Frontend)
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type = 'inbox' } = req.query;
    const offset = (page - 1) * limit;

    // Gọi Service Backend (hàm getMessages bạn đã cung cấp)
    const { count, rows } = await notificationService.getMessages(userId, type, limit, offset);

    // MAP DỮ LIỆU: Chuyển từ field DB (tiếng Việt/snake_case) sang field Frontend (Message.jsx cần)
    const formattedNotifications = rows.map(item => ({
      id: item.id,
      sender: item.nguoi_gui ? item.nguoi_gui.ho_ten : "Hệ thống",
      receiver: item.nguoi_nhan ? item.nguoi_nhan.ho_ten : "Tôi",
      subject: item.tieu_de || "(Không tiêu đề)",
      preview: item.noi_dung || "", // Message.jsx dùng 'preview' để hiển thị nội dung
      date: item.created_at,        // Message.jsx dùng 'date'
      starred: item.is_starred,     // Message.jsx dùng 'starred'
      read: item.da_doc
    }));

    res.status(200).json({
      data: formattedNotifications, // Frontend đọc biến này
      meta: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thông báo." });
  }
};

// 2. Gửi tin nhắn
// notification.controller.js

// 2. Gửi tin nhắn (CẬP NHẬT)
exports.create = async (req, res) => {
  try {
    const senderId = req.user.id;
    
    // --- SỬA ĐOẠN NÀY: Thêm biến 'type' vào destructuring ---
    // Frontend gửi lên: recipient_ids, subject, content, schedule_time, type
    const { recipient_ids, subject, content, schedule_time, type } = req.body;

    if (!recipient_ids || !recipient_ids.length || !content) {
      return res.status(400).json({ message: "Thiếu người nhận hoặc nội dung." });
    }

    await notificationService.sendMessage({
      senderId,
      recipientIds: recipient_ids,
      subject,
      content,
      scheduleTime: schedule_time,
      
      // --- TRUYỀN TYPE XUỐNG SERVICE ---
      // Nếu frontend gửi 'canhcao' thì dùng, không thì mặc định là 'tinnhan'
      type: type || 'tinnhan' 
    });

    res.status(201).json({ message: "Gửi tin nhắn thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gửi tin nhắn.", error: error.message });
  }
};

// 3. Đánh dấu sao (Toggle Star)
exports.toggleStar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await notificationService.toggleStar(id, userId);
    res.status(200).json({ message: "Đã cập nhật trạng thái sao." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server.", error: error.message });
  }
};

// 4. Xóa tin nhắn (Chuyển vào thùng rác)
exports.delete = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await notificationService.moveToTrash(id, userId); // Gọi hàm moveToTrash trong Service Backend
    res.status(200).json({ message: "Đã chuyển vào thùng rác." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server.", error: error.message });
  }
};

exports.sendAlert = async (req, res) => {
  try {
    const driverId = req.user.id; // Lấy ID tài xế từ token
    const { alertType, message, toParents, toAdmin } = req.body;

    if (!message || !alertType) {
      return res.status(400).json({ message: "Thiếu nội dung cảnh báo." });
    }

    const result = await notificationService.sendDriverAlert({
      driverId,
      alertType,
      message,
      toParents,
      toAdmin
    });

    res.status(200).json({ 
      message: "Đã gửi cảnh báo thành công!", 
      recipientCount: result.count 
    });
  } catch (error) {
    console.error("Lỗi gửi cảnh báo:", error);
    res.status(500).json({ message: "Lỗi server khi gửi cảnh báo." });
  }
};