import React, { useState } from "react";
import Header from "../../components/common/Header/header";
import notifications from "../../data/notifications";
import "./Notifications.css";

const PER_PAGE = 8;

export default function Notifications() {
  const [tab, setTab] = useState("inbox");
  const [page, setPage] = useState(1);

  const items = notifications.filter((n) => n.type === tab);
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));

  const visible = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function goto(p) {
    setPage(Math.min(Math.max(1, p), totalPages));
  }

  return (
    <div className="notifications-page">
      <Header title="Thông báo" showSearch={false} />

      <div className="notifications-content">
        <div className="notifications-header">
          <div className="tabs">
            <button
              className={`tab ${tab === "inbox" ? "active" : ""}`}
              onClick={() => {
                setTab("inbox");
                setPage(1);
              }}
            >
              Hộp thư đến
            </button>
            <button
              className={`tab ${tab === "sent" ? "active" : ""}`}
              onClick={() => {
                setTab("sent");
                setPage(1);
              }}
            >
              Đã gửi
            </button>
          </div>
        </div>

        <div className="notifications-list-card">
          <div className="notifications-list-header">
            <div className="col col-check">
              <input type="checkbox" />
            </div>
            <div className="col col-from">Người gửi</div>
            <div className="col col-subject">Tiêu đề</div>
            <div className="col col-preview">Xem trước</div>
            <div className="col col-time">Thời gian</div>
          </div>

          <div className="notifications-list">
            {visible.length === 0 && (
              <div className="empty">Không có thông báo.</div>
            )}
            {visible.map((n) => (
              <div
                key={n.id}
                className={`notification-row ${n.read ? "read" : "unread"}`}
              >
                <div className="col col-check">
                  <input type="checkbox" />
                </div>
                <div className="col col-from">
                  <strong>{n.from}</strong>
                </div>
                <div className="col col-subject">{n.subject}</div>
                <div className="col col-preview">{n.preview}</div>
                <div className="col col-time">{n.time}</div>
              </div>
            ))}
          </div>

          <div className="notifications-footer">
            <div className="pagination">
              <button
                onClick={() => goto(page - 1)}
                disabled={page <= 1}
              >{`‹`}</button>
              <span className="page-info">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => goto(page + 1)}
                disabled={page >= totalPages}
              >{`›`}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
