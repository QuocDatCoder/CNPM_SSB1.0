// Custom API client cho auth (giữ nguyên response structure)
const API_BASE_URL = "http://localhost:8080/api";

const authApi = {
  async post(endpoint, data) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || `HTTP Error: ${response.status}`);
    }

    // Trả về toàn bộ response {success, message, data}
    return await response.json();
  },
};

class AuthService {
  /**
   * Đăng nhập
   * @param {string} username - Tên đăng nhập hoặc email
   * @param {string} password - Mật khẩu
   */
  async login(username, password) {
    try {
      // Backend trả về {success, message, data}
      const response = await authApi.post("/auth/login", {
        username,
        password,
      });

      // Nếu đăng nhập thành công, lưu token và user vào sessionStorage (mỗi tab riêng)
      if (response.success && response.data) {
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
        return response.data;
      }

      // Nếu đăng nhập thất bại, throw error với message từ backend
      throw new Error(response.message || "Đăng nhập thất bại");
    } catch (error) {
      console.error("Login error:", error);
      // Re-throw để component có thể bắt và hiển thị
      throw error;
    }
  }

  /**
   * Đăng xuất
   */
  logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  }

  /**
   * Lấy thông tin user hiện tại từ sessionStorage
   */
  getCurrentUser() {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  }

  /**
   * Lấy token
   */
  getToken() {
    return sessionStorage.getItem("token");
  }

  /**
   * Kiểm tra đã đăng nhập chưa
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Lấy vai trò của user
   */
  getUserRole() {
    const user = this.getCurrentUser();
    return user ? user.vai_tro : null;
  }
}

export default new AuthService();
