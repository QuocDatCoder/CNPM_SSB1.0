import React, { useState, useEffect, useMemo } from "react";
import Header from "../../components/common/Header/header";
import "./Message.css";
import NotificationService from "../../services/notification.service";
import RouteService from "../../services/route.service";

// Cập nhật key khớp với logic backend (is_starred, is_deleted)
const messageCategories = [
  { icon: "/icons/message/inbox.png", label: "Hộp Thư Đến", key: "inbox" },
  { icon: "/icons/message/sent.png", label: "Đã Gửi", key: "sent" },
  { icon: "/icons/message/important.png", label: "Quan Trọng", key: "starred" }, 
  { icon: "/icons/message/schedule-sending.png", label: "Đã Lên Lịch", key: "scheduled" },
  { icon: "/icons/message/delete.png", label: "Thùng Rác", key: "trash" },
];

export default function Message() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState("inbox");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal States
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Compose Logic
  const [recipientType, setRecipientType] = useState("parent"); 
  const [recipientFilter, setRecipientFilter] = useState(""); 
  const [rawRecipients, setRawRecipients] = useState([]); 
  const [selectedRecipientIds, setSelectedRecipientIds] = useState([]); 
  const [availableRoutes, setAvailableRoutes] = useState([]);

  // Form Data
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // --- LIFECYCLE ---
  useEffect(() => {
    loadMessages();
    setSearchQuery("");
  }, [activeCategory]);

  useEffect(() => {
    loadRoutes();
  }, []);

  // Load người nhận khi mở modal và chọn tuyến
  useEffect(() => {
    if (showComposeModal && recipientFilter) {
        loadRecipientsData();
    } else {
        setRawRecipients([]);
    }
    if (showComposeModal) setSelectedRecipientIds([]); 
  }, [recipientType, recipientFilter, showComposeModal]);

  // --- API CALLS ---
  const loadRoutes = async () => {
    try {
      const routes = await RouteService.getAllRoutesWithStops();
      setAvailableRoutes(routes.map(r => ({ id: r.id, name: r.name })));
    } catch (error) {
      console.error("Lỗi tải tuyến:", error);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await NotificationService.getMessages(activeCategory);
      setMessages(Array.isArray(res) ? res : (res.data || []));
    } catch (error) {
      console.error("Lỗi tải tin nhắn:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipientsData = async () => {
    try {
      let group = recipientType === 'driver' ? 'drivers' : 'all-parents';
      const res = await NotificationService.getRecipients(group, recipientFilter);
      setRawRecipients(Array.isArray(res) ? res : (res.data || []));
    } catch (error) {
      console.error("Lỗi tải người nhận:", error);
      setRawRecipients([]);
    }
  };

  // --- ACTIONS ---
  const handleSendMessage = async (isScheduled = false) => {
    if (!messageTitle.trim() || !messageContent.trim()) return alert("Thiếu tiêu đề hoặc nội dung!");
    
    let finalIds = [...selectedRecipientIds];
    if (finalIds.length === 0) {
       if (displayList.length === 0) return alert("Danh sách người nhận trống!");
       if (!window.confirm(`Gửi cho toàn bộ ${displayList.length} người trong danh sách này?`)) return;
       finalIds = displayList.map(u => u.id);
    }

    const payload = {
      recipient_ids: finalIds,
      subject: messageTitle,
      content: messageContent,
      schedule_time: isScheduled ? `${scheduleDate} ${scheduleTime}` : null,
      type: 'tinnhan'
    };

    try {
      await NotificationService.sendMessage(payload);
      alert("Thành công!");
      setShowComposeModal(false); setShowScheduleModal(false);
      setMessageTitle(""); setMessageContent(""); setSelectedRecipientIds([]);
      if (activeCategory === 'sent') loadMessages();
    } catch (error) {
      alert("Lỗi: " + (error.response?.data?.message || error.message));
    }
  };

  // Xóa tin nhắn (Chuyển is_deleted = 1)
  const handleDeleteMessage = async (e, id) => {
    e.stopPropagation();
    if(window.confirm("Chuyển tin nhắn này vào thùng rác?")) {
      try {
        await NotificationService.deleteMessage(id);
        setMessages(prev => prev.filter(m => m.id !== id));
      } catch (error) { alert("Lỗi khi xóa!"); }
    }
  };

  // Đánh dấu quan trọng (Chuyển is_starred = 1/0)
  const handleToggleStar = async (e, id) => {
    e.stopPropagation();
    try {
      await NotificationService.toggleStar(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
    } catch (error) { console.error(error); }
  };


  // --- HELPERS ---
  const displayList = useMemo(() => {
    if (!rawRecipients.length) return [];
    return rawRecipients.map(u => ({
      id: u.id,
      name: u.ho_ten,
      subInfo: recipientType === 'driver' ? (u.so_dien_thoai || "Tài xế") : (u.children ? `Con: ${u.children.map(c => c.ho_ten).join(", ")}` : "")
    }));
  }, [rawRecipients, recipientType]);

  const formatDate = (dateStr) => {
    if(!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  // Logic hiển thị cột người dùng
  const isSentBox = activeCategory === 'sent' || activeCategory === 'scheduled';
  
  // Trong Trash hoặc Starred: Nếu mình gửi -> hiện người nhận, ngược lại -> hiện người gửi
  // Để đơn giản, ở đây ta giả định hiển thị linh hoạt dựa trên dữ liệu
  const getUserDisplay = (msg) => {
      if (isSentBox) return msg.receiver || "Không xác định";
      if (activeCategory === 'inbox') return msg.sender || "Hệ thống";
      // Với Trash/Starred: Ưu tiên hiện người gửi, trừ khi mình là người gửi
      return msg.sender || msg.receiver;
  };

  // Select logic modal
  const handleSelectOne = (id) => setSelectedRecipientIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleSelectAll = (e) => setSelectedRecipientIds(e.target.checked ? displayList.map(i => i.id) : []);

  // Filter
  const filteredMessages = messages.filter(msg => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const userDisplay = getUserDisplay(msg);
    return (msg.subject?.toLowerCase().includes(q) || userDisplay?.toLowerCase().includes(q));
  });

  return (
    <div className="message-page">
      <Header title="Quản lý Tin nhắn" />
      <div className="message-container">
        
        {/* SIDEBAR */}
        <div className={`message-sidebar ${sidebarExpanded ? "expanded" : "collapsed"}`}
          onMouseEnter={() => setSidebarExpanded(true)} onMouseLeave={() => setSidebarExpanded(false)}>
          <div className="categories-wrapper">
            {messageCategories.map((cat) => (
              <div key={cat.key} className={`message-category ${activeCategory === cat.key ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.key)}>
                <img src={cat.icon} alt={cat.label} className="category-icon" />
                {sidebarExpanded && <span className="category-label">{cat.label}</span>}
              </div>
            ))}
          </div>
          {sidebarExpanded && (
            <button className="new-message-btn" onClick={() => setShowComposeModal(true)}>+ Soạn Tin</button>
          )}
        </div>

        {/* CONTENT */}
        <div className="message-content">
          <div className="message-search-bar">
            <input type="text" placeholder="Tìm kiếm tin nhắn..." className="message-search-input"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            
          </div>

          {/* HEADER ROW */}
          <div className="message-list-header">
            <div className="header-cell col-star"></div>
            <div className="header-cell col-user">
              {isSentBox ? "Người nhận" : "Người gửi"}
            </div>
            <div className="header-cell col-subject">Tiêu đề</div>
            <div className="header-cell col-content">Nội dung</div>
            <div className="header-cell col-time">Thời gian</div>
            <div className="header-cell col-action"></div>
          </div>

          {/* LIST */}
          <div className="message-list">
             {loading && <div className="loading-text">Đang tải dữ liệu...</div>}
             {!loading && filteredMessages.length === 0 && <div className="empty-state">Không có tin nhắn nào.</div>}
             
             {!loading && filteredMessages.map((msg) => (
              <div key={msg.id} className={`message-item ${msg.read ? '' : 'unread'}`}>
                
                {/* 1. Sao (is_starred) */}
                <div className="cell-star">
                  <button className={`star-btn ${msg.starred ? "starred" : ""}`} 
                          onClick={(e) => handleToggleStar(e, msg.id)}>
                    {msg.starred ? "★" : "☆"}
                  </button>
                </div>

                {/* 2. Người Gửi/Nhận */}
                <div className="cell-user" title={getUserDisplay(msg)}>
                  {getUserDisplay(msg)}
                </div>

                {/* 3. Tiêu đề */}
                <div className="cell-subject" title={msg.subject}>
                    {msg.subject || "(Không tiêu đề)"}
                </div>

                {/* 4. Nội dung */}
                <div className="cell-content" title={msg.preview}>
                    {msg.preview}
                </div>

                {/* 5. Thời gian */}
                <div className="cell-time">
                    {formatDate(msg.date)}
                </div>

                {/* 6. Xóa (is_deleted) */}
                <div className="cell-action">
                  <button className="message-delete-btn" onClick={(e) => handleDeleteMessage(e, msg.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- MODAL SOẠN TIN --- */}
      {showComposeModal && (
        <div className="message-modal-overlay" onClick={() => setShowComposeModal(false)}>
          <div className="message-compose-modal" onClick={(e) => e.stopPropagation()}>
            <div className="compose-header">
              <h2>Soạn tin mới</h2>
              <button className="close-modal-btn" onClick={() => setShowComposeModal(false)}>×</button>
            </div>
            <div className="compose-body">
              <div className="compose-step-block">
                <label className="step-label">1. Gửi đến:</label>
                <div className="recipient-type-group">
                  <div className={`type-option ${recipientType === 'driver' ? 'active' : ''}`}
                    onClick={() => { setRecipientType('driver'); setRecipientFilter(""); setRawRecipients([]); }}>
                    <span className="type-icon">👮‍♂️</span> <span className="type-text">Tài xế</span>
                  </div>
                  <div className={`type-option ${recipientType === 'parent' ? 'active' : ''}`}
                    onClick={() => { setRecipientType('parent'); setRecipientFilter(""); setRawRecipients([]); }}>
                    <span className="type-icon">👨‍👩‍👧‍👦</span> <span className="type-text">Phụ huynh</span>
                  </div>
                </div>
              </div>

              <div className="compose-step-block">
                <label className="step-label">2. Chọn Tuyến xe:</label>
                <select className="route-select-dropdown" value={recipientFilter} onChange={(e) => setRecipientFilter(e.target.value)}>
                  <option value="">-- Vui lòng chọn tuyến xe --</option>
                  {availableRoutes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {/* KHỐI DANH SÁCH NGƯỜI NHẬN (Đã sửa CSS ở dưới) */}
              {recipientFilter && (
                <div className="compose-step-block fade-in">
                  <div className="list-header-row">
                      <label className="step-label">3. Danh sách người nhận ({displayList.length}):</label>
                      {displayList.length > 0 && (
                        <div className="select-all-wrapper">
                           <input type="checkbox" id="selectAll" onChange={handleSelectAll}
                              checked={displayList.length > 0 && selectedRecipientIds.length === displayList.length} />
                           <label htmlFor="selectAll">Chọn tất cả</label>
                        </div>
                      )}
                  </div>
                  <div className="recipient-list-container">
                      {displayList.length === 0 ? <div className="no-data-state">Không tìm thấy người nhận nào.</div> : 
                        <div className="list-items">
                            {displayList.map(item => (
                                <div key={item.id} className={`recipient-item ${selectedRecipientIds.includes(item.id) ? 'selected' : ''}`} 
                                     onClick={() => handleSelectOne(item.id)}>
                                    <input type="checkbox" checked={selectedRecipientIds.includes(item.id)} readOnly />
                                    <div className="rec-info">
                                        <span className="rec-name">{item.name}</span>
                                        {/* Hiển thị thêm thông tin phụ huynh/tài xế */}
                                        <span className="rec-sub">{item.subInfo}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                      }
                  </div>
                </div>
              )}

              <hr className="divider" />
              <div className="compose-content-area">
                <input className="compose-input" placeholder="Tiêu đề tin nhắn..." value={messageTitle} onChange={e => setMessageTitle(e.target.value)} />
                <textarea className="compose-textarea" placeholder="Nhập nội dung..." rows="5" value={messageContent} onChange={e => setMessageContent(e.target.value)} />
              </div>
            </div>
            <div className="compose-actions">
              <button className="btn-schedule" onClick={() => { setShowComposeModal(false); setShowScheduleModal(true); }}>📅 Lên lịch</button>
              <button className="btn-send" onClick={() => handleSendMessage(false)}>🚀 Gửi ngay ({selectedRecipientIds.length})</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL LÊN LỊCH --- */}
      {showScheduleModal && (
        <div className="message-modal-overlay" onClick={() => setShowScheduleModal(false)}>
           <div className="message-schedule-modal" onClick={(e) => e.stopPropagation()}>
              <div className="schedule-header"><h2>Lên lịch gửi</h2><button className="close-modal-btn" onClick={() => setShowScheduleModal(false)}>×</button></div>
              <div className="schedule-body">
                 <div className="schedule-field"><label>Ngày:</label><input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} /></div>
                 <div className="schedule-field"><label>Giờ:</label><input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} /></div>
              </div>
              <div className="schedule-actions">
                 <button className="btn-confirm" onClick={() => handleSendMessage(true)}>Xác nhận</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}