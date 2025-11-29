import React from "react";
import "./Notifications.css";
// parents 
function Notifications() {
  const notifications = [
    {
      id: 1,
      title: "Thông báo thay đổi lịch trình",
      message: "Lịch đón buổi sáng ngày mai thay đổi từ 6:30 sang 7:00",
      time: "2 giờ trước",
    },
    {
      id: 2,
      title: "Xe đã đến điểm đón",
      message: "Xe buýt đã đến gần điểm đón của bạn",
      time: "1 ngày trước",
    },
    {
      id: 3,
      title: "Thông báo bảo trì xe",
      message: "Xe buýt sẽ được bảo trì định kỳ vào ngày mai",
      time: "2 ngày trước",
    },
  ];

  return (
    <div className="parent-notifications-page">
      <div className="parent-notifications-content">
        <div className="parent-notifications-list">
          {notifications.map((notification) => (
            <div key={notification.id} className="parent-notification-item">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <span className="parent-notification-time">
                {notification.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
