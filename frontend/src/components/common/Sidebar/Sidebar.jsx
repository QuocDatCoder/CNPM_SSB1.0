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

export default function Sidebar() {
  return (
    <div className="sidebar">
      {menuItems.map((item, index) => (
        <React.Fragment key={index}>
          {item.divider && <hr className="divider" />}
          <div className="menu-item">
            <img src={item.icon} alt={item.label} className="menu-icon" />
            <span>{item.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
