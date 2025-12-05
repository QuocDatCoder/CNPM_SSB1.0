import api from "./api";

const API_URL = "http://localhost:5000/api/notifications";

class NotificationService {
  /**
   * Lấy danh sách tin nhắn theo loại (inbox, sent, important, scheduled, trash)
   * @param {string} type - Loại tin nhắn: inbox, sent, important, scheduled, trash
   * @param {number} page - Trang (mặc định 1)
   * @param {number} limit - Số tin trên trang (mặc định 20)
   */
  async getMessages(type = "inbox", page = 1, limit = 20) {
    try {
      const response = await api.get(`${API_URL}`, {
        params: { type, page, limit },
      });
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }

  /**
   * Gửi tin nhắn
   * @param {Object} payload - { recipient_ids, subject, content, schedule_time, type }
   */
  async sendMessage(payload) {
    try {
      const response = await api.post(`${API_URL}`, {
        recipient_ids: payload.recipientIds || payload.recipient_ids,
        subject: payload.subject,
        content: payload.content,
        schedule_time: payload.scheduleTime || payload.schedule_time,
        type: payload.type || "tinnhan",
      });
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Đánh dấu sao tin nhắn
   * @param {number} id - ID tin nhắn
   */
  async toggleStar(id) {
    try {
      const response = await api.put(`${API_URL}/${id}/star`);
      return response.data;
    } catch (error) {
      console.error("Error toggling star:", error);
      throw error;
    }
  }

  /**
   * Xóa tin nhắn (vào thùng rác)
   * @param {number} id - ID tin nhắn
   */
  async deleteMessage(id) {
    try {
      const response = await api.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  /**
   * Gửi cảnh báo từ tài xế
   * @param {Object} payload - { alert_type, message, to_admin, to_parents }
   */
  async sendAlert(payload) {
    try {
      const response = await api.post(`${API_URL}/alert`, {
        alert_type: payload.alertType,
        message: payload.message,
        to_admin: payload.toAdmin,
        to_parents: payload.toParents,
      });
      return response.data;
    } catch (error) {
      console.error("Error sending alert:", error);
      throw error;
    }
  }
}

export default new NotificationService();
