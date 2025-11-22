import React from "react";
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
}) {
  const menuItems = propMenuItems || defaultMenuItems;

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
    </div>
  );
}
