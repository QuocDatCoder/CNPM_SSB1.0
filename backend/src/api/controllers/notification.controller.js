const notificationService = require('../../services/notification.service');

// 1. Lấy danh sách tin nhắn
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    // Đảm bảo page và limit là số nguyên
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type || 'inbox';
    const offset = (page - 1) * limit;

    const { count, rows } = await notificationService.getMessages(userId, type, limit, offset);

    // Map dữ liệu sang format Frontend cần
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

// 2. Gửi tin nhắn (Admin/Parent gửi)
exports.create = async (req, res) => {
  try {
    const senderId = req.user.id;
    // Lấy đúng các trường từ Frontend gửi lên
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

// 3. Đánh dấu sao
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

// 4. Xóa tin nhắn (Vào thùng rác)
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

// 5. Gửi cảnh báo (Dành cho Driver)
exports.sendDriverAlert = async (req, res) => {
  try {
    const senderId = req.user.id; // ID tài xế đang đăng nhập
    const { recipient_ids, message, alertType } = req.body;

    // 1. Validate dữ liệu đầu vào
    if (!recipient_ids || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
      return res.status(400).json({ message: "Danh sách người nhận (recipient_ids) không hợp lệ." });
    }
    if (!message) {
      return res.status(400).json({ message: "Nội dung cảnh báo không được để trống." });
    }

    // 2. Gọi Service để lưu vào DB (Service đã có hàm sendMessage dùng bulkCreate)
    // Chúng ta tái sử dụng hàm sendMessage vì nó đã hỗ trợ gửi cho nhiều người
    const result = await notificationService.sendMessage({
      senderId: senderId,
      recipientIds: recipient_ids, // Mảng ID: [1, 50, 51, 52...]
      subject: "⚠️ CẢNH BÁO TỪ TÀI XẾ", // Hoặc map theo alertType
      content: message,
      type: alertType || 'canhbao',
      scheduleTime: null // Gửi ngay lập tức
    });

    // 3. Trả về kết quả
    return res.status(200).json({ 
  success: true,  // <--- Code mới có chữ success
  message: `Đã gửi thành công cho ${result.length} người.`,
  data: result    // <--- Code mới có chữ data
  });

  } catch (error) {
    console.error("Lỗi gửi cảnh báo (Driver):", error);
    return res.status(500).json({ message: "Lỗi Server khi gửi cảnh báo." });
  }
};