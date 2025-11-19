import React from "react";
import "./Sidebar.css";

const menuItems = [
  { icon: "/icons/home.png", label: "Trang chủ" },
  { icon: "/icons/bus.png", label: "Xe buýt" },
  { icon: "/icons/driver.png", label: "Tài xế" },
  { icon: "/icons/route.png", label: "Tuyến đường" },
  { icon: "/icons/schedule.png", label: "Lịch trình" },
  { icon: "/icons/student.png", label: "Học sinh" },
  { icon: "/icons/message.png", label: "Tin nhắn", divider: true },
];

export default function Sidebar({ active, onSelect }) {
  return (
    <div className="sidebar">
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
