import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import AuthService from "../../services/auth.service";

// Ảnh nằm trong thư mục public, sử dụng đường dẫn trực tiếp
const busBackgroundImage = "/image/background-login.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { username, password } = formData;

      // Validation
      if (!username || !password) {
        setError("Vui lòng nhập tên đăng nhập và mật khẩu");
        setLoading(false);
        return;
      }

      // Call login API
      const data = await AuthService.login(username, password);

      // Navigate based on role
      const role = data.user.vai_tro;
      switch (role) {
        case "admin":
          navigate("/admin");
          break;
        case "taixe":
          navigate("/driver");
          break;
        case "phuhuynh":
          navigate("/parent");
          break;
        default:
          setError("Vai trò không hợp lệ");
          setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <div className="login-card">
          {/* Phần bên trái: Hình ảnh background */}
          <div
            className="login-left"
            style={{ backgroundImage: `url(${busBackgroundImage})` }}
          >
            <div className="overlay">
              <div className="left-content">
                <div className="icon-bus-large">
                  {/* Icon xe buýt lớn */}
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 6v6" />
                    <path d="M15 6v6" />
                    <path d="M2 12h19.6" />
                    <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
                    <circle cx="7" cy="18" r="2" />
                    <path d="M9 18h5" />
                    <circle cx="17" cy="18" r="2" />
                  </svg>
                </div>
                <h1>An toàn cho con, an tâm cho bạn.</h1>
                <p>
                  Hệ thống theo dõi xe buýt trường học thông minh, mang lại sự
                  yên tâm cho phụ huynh và hỗ trợ tối đa cho tài xế.
                </p>
              </div>
            </div>
          </div>

          {/* Phần bên phải: Form đăng nhập */}
          <div className="login-right">
            <div className="form-header">
              <div className="brand">
                {/* Icon bus nhỏ màu xanh */}
                <svg
                  className="brand-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 6v6" />
                  <path d="M15 6v6" />
                  <path d="M2 12h19.6" />
                  <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
                  <circle cx="7" cy="18" r="2" />
                  <path d="M9 18h5" />
                  <circle cx="17" cy="18" r="2" />
                </svg>
                <span className="brand-name">SmartBus</span>
              </div>
              <h2>Đăng nhập vào hệ thống</h2>
              <p className="subtitle">
                Chào mừng trở lại! Vui lòng nhập thông tin của bạn.
              </p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="username">Tên đăng nhập hoặc Email</label>
                <input
                  type="text"
                  id="username"
                  placeholder="Nhập email của bạn"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">Mật khẩu</label>
                  <a href="#" className="forgot-password">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Nhập mật khẩu của bạn"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Chưa có tài khoản?{" "}
                <a href="#" className="register-link">
                  Đăng ký ngay
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
