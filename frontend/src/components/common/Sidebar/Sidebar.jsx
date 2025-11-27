import React from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../../services/auth.service";
import "./Sidebar.css";

const defaultMenuItems = [
  { icon: "/icons/home.png", label: "Trang chủ" },
  { icon: "/icons/bus.png", label: "Xe buýt" },
  { icon: "/icons/driver.png", label: "Tài xế" },
  { icon: "/icons/route.png", label: "Tuyến đường" },
  { icon: "/icons/schedule.png", label: "Lịch trình" },
  { icon: "/icons/student.png", label: "Học sinh" },
  { icon: "/icons/message.png", label: "Tin nhắn" },
  { icon: "/icons/statistical.png", label: "Thống kê", divider: true },
];

export default function Sidebar({
  active,
  onSelect,
  menuItems: propMenuItems,
  showAlertButton = false,
}) {
  const menuItems = propMenuItems || defaultMenuItems;
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      AuthService.logout();
      navigate("/");
    }
  };

  return (
    <div className="sidebar">
      <div className="logo-session">
        <img src="/image/logo.png" className="logo-image" />
      </div>
      {menuItems.map((item, index) => (
        <React.Fragment key={index}>
          {item.divider && <hr className="divider" />}
          <div
            className={`menu-item ${active === item.label ? "active" : ""}`}
            onClick={() => onSelect && onSelect(item.label)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && onSelect && onSelect(item.label)
            }
          >
            <div className="item-icon">
              <img src={item.icon} alt={item.label} className="menu-icon" />
            </div>
            <div className="label-icon">
              <span>{item.label}</span>
            </div>
          </div>
        </React.Fragment>
      ))}
      {/* Footer area with alert + logout */}
      <div className="sidebar-footer">
        {showAlertButton && (
          <button
            className="alert-button"
            onClick={() => {
              if (typeof window !== "undefined")
                console.log("Gửi cảnh báo clicked");
              // If parent provided a handler, call it via onSelect with a special label
              onSelect && onSelect("Gửi cảnh báo");
            }}
          >
            Gửi cảnh báo
          </button>
        )}

        {/* Logout Button */}
        <button className="logout-button" onClick={handleLogout}>
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
