import React, { useState, useEffect } from "react";
import NotificationService from "../../services/notification.service"; // Service API
import "./Notifications.css";

const PER_PAGE = 8;

export default function Notifications() {
  const [tab, setTab] = useState("inbox");
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState([]); // State chứa list thật
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  // Load thông báo từ API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await NotificationService.getMessages(tab);
      // Xử lý dữ liệu trả về từ API (res.data hoặc res)
      const data = Array.isArray(res) ? res : (res.data || []);
      setNotifications(data);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [tab]); // Reload khi đổi tab

  // --- Logic Phân trang Client-side ---
  const totalPages = Math.max(1, Math.ceil(notifications.length / PER_PAGE));
  const visible = notifications.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function goto(p) {
    setPage(Math.min(Math.max(1, p), totalPages));
  }

  // Helper format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="notifications-page">
      <div className="notifications-content">
        {/* Header Tabs */}
        <div className="notifications-header">
          <div className="tabs">
            <button className={`tab ${tab === "inbox" ? "active" : ""}`} onClick={() => setTab("inbox")}>
              Hộp thư đến
            </button>
            <button className={`tab ${tab === "sent" ? "active" : ""}`} onClick={() => setTab("sent")}>
              Đã gửi
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="notifications-list-card">
          <div className="notifications-list-header">
            <div className="col col-check"><input type="checkbox" /></div>
            <div className="col col-from">{tab === 'inbox' ? 'Người gửi' : 'Người nhận'}</div>
            <div className="col col-subject">Tiêu đề</div>
            <div className="col col-preview">Nội dung</div>
            <div className="col col-time">Thời gian</div>
          </div>

          <div className="notifications-list">
            {loading && <div className="loading">Đang tải...</div>}
            
            {!loading && visible.length === 0 && (
              <div className="empty">Không có thông báo.</div>
            )}

            {!loading && visible.map((n) => (
              <div key={n.id} className={`notification-row ${n.read ? "read" : "unread"} ${n.type === 'alert' ? 'alert-row' : ''}`}>
                <div className="col col-check"><input type="checkbox" /></div>
                <div className="col col-from">
                  <strong>{tab === 'inbox' ? n.sender : n.receiver}</strong>
                </div>
                <div className="col col-subject">
                   {/* Thêm icon cảnh báo nếu là loại alert */}
                   {n.subject.includes("CẢNH BÁO") && "⚠️ "}
                   {n.subject}
                </div>
                <div className="col col-preview">{n.preview}</div>
                <div className="col col-time">{formatDate(n.date)}</div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="notifications-footer">
            <div className="pagination">
              <button onClick={() => goto(page - 1)} disabled={page <= 1}>‹</button>
              <span className="page-info">{page} / {totalPages}</span>
              <button onClick={() => goto(page + 1)} disabled={page >= totalPages}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}