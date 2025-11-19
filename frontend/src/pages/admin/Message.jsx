import React, { useState } from "react";
import Header from "../../components/common/Header/header";
import "./Message.css";

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
    console.log("New message");
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
                  ☆
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
    </div>
  );
}
