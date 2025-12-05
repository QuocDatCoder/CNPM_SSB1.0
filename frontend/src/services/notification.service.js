import api from "./api";

const NotificationService = {
  // Thêm params cho getMessages
 getMessages: (type, page = 1, limit = 20) => {
    // Truyền trực tiếp vào chuỗi URL để đảm bảo chính xác 100%
    return api.get(`/notifications?type=${type}&page=${page}&limit=${limit}`);
  },

  sendMessage: (payload) => {
    return api.post("/notifications", payload);
  },

  toggleStar: (id) => {
    return api.put(`/notifications/${id}/star`);
  },

  deleteMessage: (id) => {
    return api.delete(`/notifications/${id}`);
  },

  // Payload alert đơn giản hóa
  sendAlert: (payload) => {
    return api.post("/notifications/alert", payload);
  }
};

export default NotificationService;
