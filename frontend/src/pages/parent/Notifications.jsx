import React, { useState, useEffect } from "react";
import "./Notifications.css";
// Import Service để gọi API
import NotificationService from "../../services/notification.service"; 

function Notifications() {
  // 1. Khai báo State để chứa dữ liệu thật
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Dùng useEffect để load dữ liệu ngay khi vào trang
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Gọi API lấy Hộp thư đến (inbox)
      const res = await NotificationService.getMessages('inbox');
      
      console.log("📥 Dữ liệu thông báo Phụ huynh:", res); // Debug log

      // Xử lý cấu trúc dữ liệu trả về (giống logic đã fix bên Message.jsx)
      let list = [];
      if (Array.isArray(res)) {
          list = res;
      } else if (res.data && Array.isArray(res.data)) {
          list = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
          list = res.data.data;
      }

      setNotifications(list);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm format thời gian cho đẹp (VD: 14:30 06/12/2025)
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className="parent-notifications-page">
      <div className="parent-notifications-content">
        <h3 style={{marginBottom: '20px', paddingLeft: '10px'}}>Thông báo mới nhất</h3>
        
        <div className="parent-notifications-list">
          {/* Hiển thị Loading */}
          {loading && <p style={{textAlign: 'center', color: '#666'}}>Đang tải dữ liệu...</p>}

          {/* Hiển thị khi không có dữ liệu */}
          {!loading && notifications.length === 0 && (
            <div className="empty-state" style={{textAlign: 'center', padding: '40px', color: '#999'}}>
              <p>Hiện tại chưa có thông báo nào.</p>
            </div>
          )}

          {/* Hiển thị danh sách thông báo thật */}
          {!loading && notifications.map((notification) => (
            <div key={notification.id} className={`parent-notification-item ${notification.read ? 'read' : 'unread'}`}>
              <div className="notification-header" style={{display: 'flex', justifyContent: 'space-between'}}>
                {/* Dữ liệu từ Backend trả về là: subject (tiêu đề) */}
                <h4>{notification.subject || notification.tieu_de || "(Không tiêu đề)"}</h4>
                
                {/* Icon hoặc nhãn nếu là tin quan trọng/cảnh báo */}
                {notification.subject?.includes("CẢNH BÁO") && <span style={{color: 'red', fontWeight: 'bold'}}>⚠️</span>}
              </div>
              
              {/* Dữ liệu từ Backend trả về là: preview (nội dung) */}
              <p>{notification.preview || notification.noi_dung}</p>
              
              <div className="notification-footer" style={{display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem', color: '#888'}}>
                 {/* Người gửi */}
                 <span>Từ: {notification.sender || "Hệ thống"}</span>
                 
                 {/* Thời gian */}
                 <span className="parent-notification-time">
                  {formatTime(notification.date || notification.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Notifications;