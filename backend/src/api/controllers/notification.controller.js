const notificationService = require('../../services/notification.service');

// 1. Lấy danh sách tin nhắn
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type || 'inbox';
    const offset = (page - 1) * limit;

    const { count, rows } = await notificationService.getMessages(userId, type, limit, offset);

    const formattedNotifications = rows.map(item => ({
      id: item.id,
      sender: item.nguoi_gui ? item.nguoi_gui.ho_ten : "Hệ thống",
      receiver: item.nguoi_nhan ? item.nguoi_nhan.ho_ten : "Tôi",
      subject: item.tieu_de || "(Không tiêu đề)",
      preview: item.noi_dung || "",
      date: item.created_at,
      starred: item.is_starred,
      read: item.da_doc
    }));

    res.status(200).json({
      data: formattedNotifications,
      meta: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thông báo." });
  }
};

// 2. Gửi tin nhắn thường
exports.create = async (req, res) => {
  try {
    const senderId = req.user.id;
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
      type: type || 'tinnhan' 
    });

    res.status(201).json({ message: "Gửi tin nhắn thành công!" });
  } catch (error) {
    console.error("Lỗi gửi tin nhắn:", error);
    res.status(500).json({ message: "Lỗi gửi tin nhắn.", error: error.message });
  }
};

// 3. API MỚI: Lấy danh sách người nhận (Hàm này đang bị thiếu gây ra lỗi)
// src/controllers/notification.controller.js

exports.getRecipients = async (req, res) => {
  try {
    const { group, routeId } = req.query; 
    const userId = req.user.id;
    let data = [];

    // Log kiểm tra xem Server có nhận được routeId không
    console.log(`📡 [API getRecipients] Group: ${group} | RouteId: ${routeId}`);

    switch (group) {
      case 'drivers':
        data = await notificationService.getAllDriversByAllRoute(routeId);
        break;
      case 'all-parents':
        // Chỉ gọi hàm này nếu routeId có giá trị hợp lệ
        data = await notificationService.getAllParentsByAllRoute(routeId);
        break;
      case 'my-route-parents':
        data = await notificationService.getParentsByDriverRoute(userId);
        break;
      default:
        return res.status(400).json({ message: "Nhóm người nhận không hợp lệ" });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Lỗi lấy danh sách người nhận:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

// 4. Đánh dấu sao
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

// 5. Xóa tin nhắn
exports.delete = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await notificationService.moveToTrash(id, userId);
    res.status(200).json({ message: "Đã chuyển vào thùng rác." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server.", error: error.message });
  }
};

// 6. Gửi cảnh báo (Driver)
exports.sendDriverAlert = async (req, res) => {
  try {
    const driverId = req.user.id; 
    const { message, alertType, toParents, toAdmin } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Nội dung cảnh báo không được để trống." });
    }
    if (!toParents && !toAdmin) {
      return res.status(400).json({ message: "Phải chọn ít nhất một nơi gửi." });
    }

    const result = await notificationService.sendDriverAlert({
      driverId,
      alertType,
      message,
      toParents: toParents === true,
      toAdmin: toAdmin === true
    });

    return res.status(200).json({ 
      success: true,
      message: result.count > 0 
        ? `Đã gửi cảnh báo thành công cho ${result.count} người.` 
        : "Không tìm thấy người nhận phù hợp.",
      data: { count: result.count }
    });

  } catch (error) {
    console.error("Lỗi gửi cảnh báo (Driver):", error);
    return res.status(500).json({ message: "Lỗi Server khi gửi cảnh báo." });
  }
};