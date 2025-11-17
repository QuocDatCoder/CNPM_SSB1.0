import React from "react";
import "./Sidebar.css";

const menuItems = [
  { icon: "../../../../public/icons/home.png", label: "Trang chủ" },
  { icon: "../../../../public/icons/bus.png", label: "Xe buýt" },
  { icon: "../../../../public/icons/driver.png", label: "Tài xế" },
  { icon: "../../../../public/icons/route.png", label: "Tuyến đường" },
  { icon: "../../../../public/icons/schedule.png", label: "Lịch trình" },
  { icon: "../../../../public/icons/student.png", label: "Học sinh" },
  {
    icon: "../../../../public/icons/message.png",
    label: "Tin nhắn",
    divider: true,
  },
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
