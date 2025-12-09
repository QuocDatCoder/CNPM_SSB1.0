import api from "./api";

const NotificationService = {
  // 1. Lấy danh sách thông báo
  getMessages: (type, page = 1, limit = 20) => {
    // SỬA: Truyền trực tiếp object params, không bọc trong { params: ... }
    return api.get("/notifications", { type, page, limit });
  },

  // 2. Lấy danh sách người nhận (SỬA LỖI 400 Ở ĐÂY)
  getRecipients(group, routeId) {
    // SỬA: Truyền thẳng object { group, routeId } vào tham số thứ 2
    return api.get("/notifications/recipients", {
      group: group,
      routeId: routeId 
    });
  },

  // 3. Gửi tin nhắn
  sendMessage: (payload) => {
    return api.post("/notifications", payload);
  },

  // 4. Gửi cảnh báo
  sendAlert: (payload) => {
    return api.post("/notifications/alert", payload);
  },

  // 5. Đánh dấu sao
  toggleStar: (id) => {
    return api.put(`/notifications/${id}/star`);
  },

  // 6. Xóa tin nhắn (vào thùng rác)
  deleteMessage: (id) => {
    return api.delete(`/notifications/${id}`);
  },
};

export default NotificationService;