import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header({ title, showSearch = true, noImage = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Lấy thông tin user từ sessionStorage (mỗi tab riêng)
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleLoginClick = () => {
    navigate("/login");
  };

  // Tạo avatar từ tên user
  const getAvatarText = (username) => {
    if (!username) {
      return <div className="avatar-default">U</div>;
    }

    return (
      <img
        src="/image/avata.png"
        alt={username}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "50%",
        }}
      />
    );
  };

  return (
    <div className="page-header">
      <div className={`header-banner ${noImage ? "no-image" : ""}`}>
        {!noImage && (
          <img
            src="/image/neon-bus.jpg"
            alt="Banner"
            className="banner-image"
          />
        )}
        <div className="banner-overlay">
          <h1 className="page-title">{title}</h1>
          <div className="header-actions">
            {user ? (
              <div className="user-info">
                <div className="user-avatar">
                  {getAvatarText(user.username)}
                </div>
                <span className="user-name">{user.username}</span>
              </div>
            ) : (
              showSearch && (
                <button className="login-btn" onClick={handleLoginClick}>
                  Đăng nhập
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
