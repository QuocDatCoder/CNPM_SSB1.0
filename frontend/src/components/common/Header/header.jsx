import React from "react";
import "./Header.css";

export default function Header({ title, showSearch = true }) {
  return (
    <div className="page-header">
      <div className="header-banner">
        <img src="/image/neon-bus.jpg" alt="Banner" className="banner-image" />
        <div className="banner-overlay">
          <h1 className="page-title">{title}</h1>
          {showSearch && (
            <div className="header-actions">
              {/* <input
                type="text"
                placeholder="Tìm kiếm"
                className="search-input"
              /> */}
              <button className="login-btn">Đăng nhập</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
