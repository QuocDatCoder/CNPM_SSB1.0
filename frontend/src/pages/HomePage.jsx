import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-container">
        <h1>Hệ thống Quản lý Xe buýt Học đường</h1>
        <p>Chọn vai trò để đăng nhập</p>

        <div className="role-cards">
          <Link to="/admin" className="role-card admin-card">
            <div className="role-icon">👨‍💼</div>
            <h2>Quản trị viên</h2>
            <p>Quản lý xe buýt, tài xế, lịch trình</p>
          </Link>

          <Link to="/driver" className="role-card driver-card">
            <div className="role-icon">🚌</div>
            <h2>Tài xế</h2>
            <p>Xem lịch trình và quản lý chuyến đi</p>
          </Link>

          <Link to="/parent" className="role-card parent-card">
            <div className="role-icon">👨‍👩‍👧</div>
            <h2>Phụ huynh</h2>
            <p>Theo dõi con em trên xe buýt</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
