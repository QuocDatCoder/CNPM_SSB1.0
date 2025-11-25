import React, { useState } from "react";
import Header from "../../components/common/Header/header";
import "./Message.css";
import studentsData from "../../data/students";

const messageCategories = [
  { icon: "/icons/message/inbox.png", label: "Hộp Thư Đến", key: "inbox" },
  { icon: "/icons/message/sent.png", label: "Đã Gửi", key: "sent" },
  {
    icon: "/icons/message/important.png",
    label: "Quan Trọng",
    key: "important",
  },
  {
    icon: "/icons/message/schedule-sending.png",
    label: "Đã Lên Lịch Gửi",
    key: "scheduled",
  },
  { icon: "/icons/message/delete.png", label: "Thùng Rác", key: "trash" },
];

const messagesData = [
  {
    id: 1,
    sender: "Tài xế",
    subject: "Đơn xin nghỉ(title)",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
  {
    id: 2,
    sender: "Phụ huynh",
    subject: "Học sinh nghỉ",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
  {
    id: 3,
    sender: "Cảnh báo",
    subject: "Tuyến số 1 đến trễ",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
  {
    id: 4,
    sender: "Tài xế",
    subject: "Đơn xin nghỉ(title)",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
  {
    id: 5,
    sender: "Phụ huynh",
    subject: "Học sinh nghỉ",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
  {
    id: 6,
    sender: "Cảnh báo",
    subject: "Tuyến số 1 đến trễ",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
  {
    id: 7,
    sender: "Tài xế",
    subject: "Đơn xin nghỉ(title)",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
  {
    id: 8,
    sender: "Phụ huynh",
    subject: "Học sinh nghỉ",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
  {
    id: 9,
    sender: "Cảnh báo",
    subject: "Tuyến số 1 đến trễ",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
  {
    id: 10,
    sender: "Tài xế",
    subject: "Đơn xin nghỉ(title)",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
  {
    id: 11,
    sender: "Phụ huynh",
    subject: "Học sinh nghỉ",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
  {
    id: 12,
    sender: "Cảnh báo",
    subject: "Tuyến số 1 đến trễ",
    preview: "Tôi tên là......(preview)",
    date: "18 thg 10",
    starred: false,
    category: "inbox",
  },
];

export default function Message() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState("inbox");
  const [messages, setMessages] = useState(messagesData);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [recipientType, setRecipientType] = useState("driver");
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [selectedParents, setSelectedParents] = useState([]);
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Lấy danh sách phụ huynh theo tuyến
  const getParentsByRoute = (routeName) => {
    const routeMap = {
      route1: "An Dương Vương",
      route2: "Lê Lợi",
      route3: "Trường Chinh",
    };

    const actualRouteName = routeMap[routeName];
    if (!actualRouteName) return [];

    return studentsData
      .filter((student) => student.route === actualRouteName)
      .map((student) => ({
        id: student.code,
        name: student.parentName,
        phone: student.contact,
        email: student.parentEmail,
        studentName: student.fullname,
      }));
  };

  // Filter messages based on active category
  const filteredMessages = messages.filter((msg) => {
    if (activeCategory === "important") {
      return msg.starred;
    }
    return msg.category === activeCategory;
  });

  const handleToggleStar = (id) => {
    setMessages(
      messages.map((msg) =>
        msg.id === id ? { ...msg, starred: !msg.starred } : msg
      )
    );
  };

  const handleSelectMessage = (id) => {
    if (selectedMessages.includes(id)) {
      setSelectedMessages(selectedMessages.filter((msgId) => msgId !== id));
    } else {
      setSelectedMessages([...selectedMessages, id]);
    }
  };

  const handleDeleteMessage = (id) => {
    setMessages(
      messages.map((msg) =>
        msg.id === id ? { ...msg, category: "trash" } : msg
      )
    );
  };

  const handleDeleteSelected = () => {
    setMessages(
      messages.map((msg) =>
        selectedMessages.includes(msg.id) ? { ...msg, category: "trash" } : msg
      )
    );
    setSelectedMessages([]);
  };

  const handleNewMessage = () => {
    setShowComposeModal(true);
    setRecipientType("driver");
    setRecipientFilter("all");
    setSelectedParents([]);
    setShowParentDropdown(false);
    setMessageTitle("");
    setMessageContent("");
  };

  const handleSendMessage = () => {
    if (!messageTitle || !messageContent) {
      alert("Vui lòng điền đầy đủ tiêu đề và nội dung!");
      return;
    }

    const newMessage = {
      id: messages.length + 1,
      sender: "Bạn",
      subject: messageTitle,
      preview: messageContent.substring(0, 50) + "...",
      date: new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "short",
      }),
      starred: false,
      category: "sent",
      recipient: recipientType,
      recipientFilter: recipientFilter,
    };

    setMessages([...messages, newMessage]);
    setShowComposeModal(false);
    alert("Đã gửi tin nhắn thành công!");
  };

  const handleScheduleSend = () => {
    setShowComposeModal(false);
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = () => {
    if (!messageTitle || !messageContent || !scheduleDate || !scheduleTime) {
      alert("Vui lòng điền đầy đủ thông tin và thời gian gửi!");
      return;
    }

    const newMessage = {
      id: messages.length + 1,
      sender: "Bạn",
      subject: messageTitle,
      preview: messageContent.substring(0, 50) + "...",
      date: `${scheduleDate} ${scheduleTime}`,
      starred: false,
      category: "scheduled",
      recipient: recipientType,
      recipientFilter: recipientFilter,
    };

    setMessages([...messages, newMessage]);
    setShowScheduleModal(false);
    alert("Đã lên lịch gửi tin nhắn!");
  };

  return (
    <div className="message-page">
      <Header title="Tin nhắn" />

      <div className="message-container">
        {/* Message Sidebar */}
        <div
          className={`message-sidebar ${
            sidebarExpanded ? "expanded" : "collapsed"
          }`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <div className="categories-wrapper">
            {messageCategories.map((category) => (
              <div
                key={category.key}
                className={`message-category ${
                  activeCategory === category.key ? "active" : ""
                }`}
                onClick={() => setActiveCategory(category.key)}
              >
                <img
                  src={category.icon}
                  alt={category.label}
                  className="category-icon"
                />
                {sidebarExpanded && (
                  <span className="category-label">{category.label}</span>
                )}
              </div>
            ))}
          </div>

          {sidebarExpanded && (
            <button className="new-message-btn" onClick={handleNewMessage}>
              Tin Mới
            </button>
          )}
        </div>

        {/* Message Content */}
        <div className="message-content">
          <div className="message-search-bar">
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="message-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {selectedMessages.length > 0 && (
              <button
                className="bulk-delete-btn"
                onClick={handleDeleteSelected}
                title="Xóa các tin đã chọn"
              >
                <img src="/icons/message/delete.png" alt="Xóa" />
                <span>Xóa ({selectedMessages.length})</span>
              </button>
            )}
          </div>

          <div className="message-list">
            {filteredMessages.map((message) => (
              <div key={message.id} className="message-item">
                <input
                  type="checkbox"
                  className="message-checkbox"
                  checked={selectedMessages.includes(message.id)}
                  onChange={() => handleSelectMessage(message.id)}
                />
                <button
                  className={`star-btn ${message.starred ? "starred" : ""}`}
                  onClick={() => handleToggleStar(message.id)}
                >
                  {message.starred ? "★" : "☆"}
                </button>
                <div className="message-info">
                  <span className="message-sender">{message.sender}</span>
                  <span className="message-subject">{message.subject}</span>
                  <span className="message-preview">{message.preview}</span>
                </div>
                <span className="message-date">{message.date}</span>
                <button
                  className="message-delete-btn"
                  onClick={() => handleDeleteMessage(message.id)}
                >
                  <img src="/icons/message/delete.png" alt="Delete" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Soạn Tin Mới */}
      {showComposeModal && (
        <div
          className="message-modal-overlay"
          onClick={() => setShowComposeModal(false)}
        >
          <div
            className="message-compose-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="compose-header">
              <h2>Soạn tin mới</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowComposeModal(false)}
              >
                ×
              </button>
            </div>

            <div
              className="compose-body"
              onClick={() => {
                if (showParentDropdown) {
                  setShowParentDropdown(false);
                }
              }}
            >
              <div className="compose-field">
                <label>Gửi đến:</label>
                <div
                  className="recipient-selection"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="recipient-top-row">
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="recipient-type"
                          value="driver"
                          checked={recipientType === "driver"}
                          style={{ accentColor: "black" }}
                          onChange={(e) => {
                            setRecipientType(e.target.value);
                            setSelectedParents([]);
                          }}
                        />
                        Tài xế
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="recipient-type"
                          value="parent"
                          checked={recipientType === "parent"}
                          style={{ accentColor: "black" }}
                          onChange={(e) => {
                            setRecipientType(e.target.value);
                            setSelectedParents([]);
                          }}
                        />
                        Phụ huynh
                      </label>
                    </div>
                    <select
                      className="recipient-filter"
                      value={recipientFilter}
                      onChange={(e) => {
                        setRecipientFilter(e.target.value);
                        setSelectedParents([]);
                        if (e.target.value !== "all") {
                          setShowParentDropdown(true);
                        } else {
                          setShowParentDropdown(false);
                        }
                      }}
                    >
                      <option value="all">Toàn bộ</option>
                      <option value="route1">Tuyến 1 - An Dương Vương</option>
                      <option value="route2">Tuyến 2 - Lê Lợi</option>
                      <option value="route3">Tuyến 3 - Trường Chinh</option>
                    </select>
                  </div>

                  {/* Hiển thị danh sách phụ huynh hoặc nút hiển thị số lượng */}
                  {recipientType === "parent" && recipientFilter !== "all" && (
                    <>
                      {showParentDropdown ? (
                        <div
                          className="parent-dropdown-wrapper"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="parent-header">
                            <label className="select-all-checkbox-label">
                              <input
                                type="checkbox"
                                checked={
                                  selectedParents.length ===
                                    getParentsByRoute(recipientFilter).length &&
                                  getParentsByRoute(recipientFilter).length > 0
                                }
                                style={{ accentColor: "black" }}
                                onChange={(e) => {
                                  const allParentIds = getParentsByRoute(
                                    recipientFilter
                                  ).map((p) => p.id);
                                  if (e.target.checked) {
                                    setSelectedParents(allParentIds);
                                  } else {
                                    setSelectedParents([]);
                                  }
                                }}
                              />
                              Chọn tất cả
                            </label>
                            <span className="selected-count-inline">
                              {selectedParents.length}/
                              {getParentsByRoute(recipientFilter).length}
                            </span>
                          </div>
                          <div className="parent-list">
                            {getParentsByRoute(recipientFilter).map(
                              (parent) => (
                                <label
                                  key={parent.id}
                                  className="parent-checkbox-label"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedParents.includes(
                                      parent.id
                                    )}
                                    style={{ accentColor: "black" }}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedParents([
                                          ...selectedParents,
                                          parent.id,
                                        ]);
                                      } else {
                                        setSelectedParents(
                                          selectedParents.filter(
                                            (id) => id !== parent.id
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <div className="parent-info">
                                    <strong>{parent.name}</strong>
                                    <span className="parent-student">
                                      PH của: {parent.studentName}
                                    </span>
                                    <span className="parent-contact">
                                      {parent.phone} - {parent.email}
                                    </span>
                                  </div>
                                </label>
                              )
                            )}
                          </div>
                          {getParentsByRoute(recipientFilter).length === 0 && (
                            <p className="no-parents">
                              Không có phụ huynh nào trong tuyến này.
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="parent-selected-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowParentDropdown(true);
                          }}
                        >
                          Đã chọn: {selectedParents.length}/
                          {getParentsByRoute(recipientFilter).length} phụ huynh
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="compose-field">
                <label>Tiêu đề:</label>
                <input
                  type="text"
                  className="compose-input"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="Nhập tiêu đề..."
                />
              </div>

              <div className="compose-field">
                <label>Nội dung:</label>
                <textarea
                  className="compose-textarea"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Nhập nội dung tin nhắn..."
                  rows="8"
                />
              </div>

              <div className="compose-toolbar">
                <button className="toolbar-btn" title="Định dạng chữ">
                  <span>Aa</span>
                </button>
                <button className="toolbar-btn" title="Đính kèm">
                  <span>📎</span>
                </button>
                <button className="toolbar-btn" title="Chèn link">
                  <span>🔗</span>
                </button>
                <button className="toolbar-btn" title="Biểu tượng cảm xúc">
                  <span>😊</span>
                </button>
                <button className="toolbar-btn" title="Hình ảnh">
                  <span>🖼️</span>
                </button>
              </div>
            </div>

            <div className="compose-actions">
              <button className="btn-send" onClick={handleSendMessage}>
                Gửi
              </button>
              <button className="btn-schedule" onClick={handleScheduleSend}>
                <span>📅</span> Lên lịch gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lên Lịch Gửi */}
      {showScheduleModal && (
        <div
          className="message-modal-overlay"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="message-schedule-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="schedule-header">
              <h2>Lên lịch gửi tin nhắn</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowScheduleModal(false)}
              >
                ×
              </button>
            </div>

            <div className="schedule-body">
              <div className="schedule-field">
                <label>Ngày gửi:</label>
                <input
                  type="date"
                  className="schedule-input"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>

              <div className="schedule-field">
                <label>Giờ gửi:</label>
                <input
                  type="time"
                  className="schedule-input"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>

              <div className="schedule-summary">
                <h3>Thông tin tin nhắn:</h3>
                <p>
                  <strong>Gửi đến:</strong>{" "}
                  {recipientType === "driver" ? "Tài xế" : "Phụ huynh"} -{" "}
                  {recipientFilter === "all" ? "Toàn bộ" : recipientFilter}
                </p>
                <p>
                  <strong>Tiêu đề:</strong> {messageTitle || "(Chưa có)"}
                </p>
                <p>
                  <strong>Nội dung:</strong>{" "}
                  {messageContent
                    ? messageContent.substring(0, 100) + "..."
                    : "(Chưa có)"}
                </p>
              </div>
            </div>

            <div className="schedule-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowScheduleModal(false)}
              >
                Hủy
              </button>
              <button className="btn-confirm" onClick={handleConfirmSchedule}>
                Xác nhận lên lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
