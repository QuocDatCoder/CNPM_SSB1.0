import React, { useState, useEffect } from "react";
import Header from "../../components/common/Header/header";
import "./Message.css";
// Import các Service
import NotificationService from "../../services/notification.service";
import RouteService from "../../services/route.service";
import StudentService from "../../services/student.service";
import DriverService from "../../services/driver.service";

const messageCategories = [
  { icon: "/icons/message/inbox.png", label: "Hộp Thư Đến", key: "inbox" },
  { icon: "/icons/message/sent.png", label: "Đã Gửi", key: "sent" },
  { icon: "/icons/message/important.png", label: "Quan Trọng", key: "important" },
  { icon: "/icons/message/schedule-sending.png", label: "Đã Lên Lịch", key: "scheduled" },
  { icon: "/icons/message/delete.png", label: "Thùng Rác", key: "trash" },
];

export default function Message() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState("inbox");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessages, setSelectedMessages] = useState([]);

  // --- States cho Modal Soạn Tin ---
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const [recipientType, setRecipientType] = useState("driver"); 
  const [recipientFilter, setRecipientFilter] = useState("all"); 
  
  const [selectedRecipients, setSelectedRecipients] = useState([]); 
  const [showDropdownList, setShowDropdownList] = useState(false);

  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [studentsList, setStudentsList] = useState([]); 
  const [driversList, setDriversList] = useState([]);

  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // 1. Load Tin nhắn
  useEffect(() => {
    loadMessages();
    setSelectedMessages([]);
    setSearchQuery("");
  }, [activeCategory]);

  // 2. Load Dữ liệu
  useEffect(() => {
    loadMetaData();
  }, []);

  const loadMetaData = async () => {
    try {
      const [routesData, studentsData, driversData] = await Promise.all([
        RouteService.getAllRoutesWithStops(),
        StudentService.getAllStudents(),
        DriverService.getAllDrivers()
      ]);

      // Xử lý Routes (KHÔNG GỘP)
      const fullRoutes = routesData.map((route) => {
        const suffix = route.loai_tuyen === 'luot_di' ? '(Đi)' : (route.loai_tuyen === 'luot_ve' ? '(Về)' : '');
        return {
            id: route.id, 
            name: `${route.name} ${suffix}`.trim(), 
            rawName: route.name 
        };
      });
      setAvailableRoutes(fullRoutes);

      // Xử lý Students
      const mappedStudents = studentsData.map((student) => ({
        id: student.id,
        fullname: student.ho_ten,
        routeId: student.current_route_id,
        routeName: student.tuyen_duong || "",
        parentId: student.parent_id,
        parentName: student.ten_phu_huynh,
        parentPhone: student.sdt_phu_huynh,
        parentEmail: student.email_phu_huynh,
      }));
      setStudentsList(mappedStudents);

      // Xử lý Drivers
      const mappedDrivers = driversData.map((driver) => ({
        id: driver.id,
        fullname: driver.fullname,
        phone: driver.phone,
        routeName: driver.routeName || driver.tuyen_duong || "Chưa phân tuyến", 
      }));
      setDriversList(mappedDrivers);

    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await NotificationService.getMessages(activeCategory);
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (res.data && Array.isArray(res.data)) data = res.data;
      setMessages(data);
    } catch (error) {
      console.error("Lỗi tải tin nhắn:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC LỌC NGƯỜI NHẬN ---
  const getFilteredList = () => {
    let list = [];

    if (recipientType === 'parent') {
      let filteredStudents = studentsList;
      if (recipientFilter !== 'all') {
        const filterId = parseInt(recipientFilter);
        filteredStudents = studentsList.filter(s => s.routeId === filterId);
      }
      
      list = filteredStudents.map(s => ({
        id: s.parentId,
        name: s.parentName,
        subInfo: `Con: ${s.fullname} (${s.routeName})`,
        contact: s.parentPhone,
        uniqueKey: `parent_${s.parentId}_stu_${s.id}`
      })).filter(p => p.id && p.name);
    } 
    else if (recipientType === 'driver') {
      let filteredDrivers = driversList;
      // Logic lọc driver (tạm thời lấy hết vì chưa có routeId)
      list = filteredDrivers.map(d => ({
        id: d.id,
        name: d.fullname,
        subInfo: d.routeName,
        contact: d.phone,
        uniqueKey: `driver_${d.id}`
      }));
    }
    return list;
  };

  const currentList = getFilteredList();

  // --- ACTIONS ---
  const handleSelectOne = (id) => {
    if (selectedRecipients.includes(id)) {
      setSelectedRecipients(selectedRecipients.filter(item => item !== id));
    } else {
      setSelectedRecipients([...selectedRecipients, id]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = [...new Set(currentList.map(item => item.id))];
      setSelectedRecipients(allIds);
    } else {
      setSelectedRecipients([]);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      (msg.subject && msg.subject.toLowerCase().includes(lowerQuery)) ||
      (msg.sender && msg.sender.toLowerCase().includes(lowerQuery)) ||
      (msg.preview && msg.preview.toLowerCase().includes(lowerQuery))
    );
  });

  const handleToggleStar = async (id) => {
     try {
       await NotificationService.toggleStar(id);
       setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, starred: !msg.starred } : msg));
     } catch(e) {}
  };

  const handleDeleteMessage = async (id) => {
    if(!window.confirm("Xóa tin nhắn này?")) return;
    try {
        await NotificationService.deleteMessage(id);
        setMessages(prev => prev.filter(m => m.id !== id));
    } catch(e) {}
  };
  
  const handleSelectMessage = (id) => {
    if (selectedMessages.includes(id)) {
      setSelectedMessages(selectedMessages.filter((msgId) => msgId !== id));
    } else {
      setSelectedMessages([...selectedMessages, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if(!window.confirm(`Xóa ${selectedMessages.length} tin nhắn?`)) return;
    try {
        await Promise.all(selectedMessages.map(id => NotificationService.deleteMessage(id)));
        setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id)));
        setSelectedMessages([]);
    } catch(e) {}
  };

  // --- XỬ LÝ GỬI TIN ---
  const handleNewMessage = () => {
    setShowComposeModal(true);
    setRecipientType("driver");
    setRecipientFilter("all");
    setSelectedRecipients([]);
    setShowDropdownList(false);
    setMessageTitle("");
    setMessageContent("");
  };

  const handleSendMessage = async (isScheduled = false) => {
    if (!messageTitle || !messageContent) return alert("Vui lòng nhập tiêu đề và nội dung!");
    if (isScheduled && (!scheduleDate || !scheduleTime)) return alert("Vui lòng chọn ngày giờ!");

    let finalRecipients = selectedRecipients;
    if (finalRecipients.length === 0) {
       finalRecipients = [...new Set(currentList.map(r => r.id))];
    }

    if (finalRecipients.length === 0) return alert("Không tìm thấy người nhận phù hợp!");

    const payload = {
      recipient_ids: finalRecipients,
      subject: messageTitle,
      content: messageContent,
      schedule_time: isScheduled ? `${scheduleDate} ${scheduleTime}` : null
    };

    try {
      await NotificationService.sendMessage(payload);
      alert(isScheduled ? "Đã lên lịch thành công!" : "Đã gửi tin nhắn!");
      setShowComposeModal(false);
      setShowScheduleModal(false);
      if (activeCategory === 'sent' || activeCategory === 'scheduled') loadMessages();
    } catch (error) {
      alert("Gửi lỗi: " + (error.response?.data?.message || "Lỗi server"));
    }
  };

  const formatDate = (dateStr) => {
      if(!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("vi-VN", {day: '2-digit', month: 'short'});
  }

  return (
    <div className="message-page">
      <Header title="Tin nhắn" />

      <div className="message-container">
        {/* Sidebar */}
        <div className={`message-sidebar ${sidebarExpanded ? "expanded" : "collapsed"}`}
          onMouseEnter={() => setSidebarExpanded(true)} onMouseLeave={() => setSidebarExpanded(false)}>
          <div className="categories-wrapper">
            {messageCategories.map((category) => (
              <div key={category.key} className={`message-category ${activeCategory === category.key ? "active" : ""}`}
                onClick={() => setActiveCategory(category.key)}>
                <img src={category.icon} alt={category.label} className="category-icon" />
                {sidebarExpanded && <span className="category-label">{category.label}</span>}
              </div>
            ))}
          </div>
          {sidebarExpanded && (
            <button className="new-message-btn" onClick={handleNewMessage}>Tin Mới</button>
          )}
        </div>

        <div className="message-content">
          <div className="message-search-bar">
            <input type="text" placeholder="Tìm kiếm" className="message-search-input"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {selectedMessages.length > 0 && (
              <button className="bulk-delete-btn" onClick={handleDeleteSelected}>
                <img src="/icons/message/delete.png" alt="Xóa" />
                <span>Xóa ({selectedMessages.length})</span>
              </button>
            )}
          </div>

          <div className="message-list">
             {loading && <p style={{padding: 20}}>Đang tải...</p>}
             {!loading && filteredMessages.map((message) => (
              <div key={message.id} className="message-item">
                <input type="checkbox" className="message-checkbox"
                  checked={selectedMessages.includes(message.id)} onChange={() => handleSelectMessage(message.id)} />
                <button className={`star-btn ${message.starred ? "starred" : ""}`} onClick={() => handleToggleStar(message.id)}>
                  {message.starred ? "★" : "☆"}
                </button>
                <div className="message-info">
                  {/* Hiển thị TỪ hoặc TỚI */}
                  <span className="message-sender">
                    {activeCategory === 'sent' 
                        ? `Tới: ${message.receiver}` 
                        : `Từ: ${message.sender}`}
                  </span>
                  <span className="message-subject">{message.subject}</span>
                  <span className="message-preview"> - {message.preview}</span>
                </div>
                <span className="message-date">{formatDate(message.date)}</span>
                <button className="message-delete-btn" onClick={() => handleDeleteMessage(message.id)}>
                  <img src="/icons/message/delete.png" alt="Delete" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Soạn Tin Mới */}
      {showComposeModal && (
        <div className="message-modal-overlay" onClick={() => setShowComposeModal(false)}>
          <div className="message-compose-modal" onClick={(e) => e.stopPropagation()}>
            <div className="compose-header">
              <h2>Soạn tin mới</h2>
              <button className="close-modal-btn" onClick={() => setShowComposeModal(false)}>×</button>
            </div>

            <div className="compose-body" onClick={() => { if (showDropdownList) setShowDropdownList(false); }}>
              <div className="compose-field">
                <label>Gửi đến:</label>
                <div className="recipient-selection" onClick={(e) => e.stopPropagation()}>
                  <div className="recipient-top-row">
                    <div className="radio-group">
                      <label className="radio-label">
                        <input type="radio" name="recipient-type" value="driver"
                          checked={recipientType === "driver"}
                          style={{ accentColor: "black" }}
                          onChange={() => { setRecipientType("driver"); setSelectedRecipients([]); }} /> Tài xế
                      </label>
                      <label className="radio-label">
                        <input type="radio" name="recipient-type" value="parent"
                          checked={recipientType === "parent"}
                          style={{ accentColor: "black" }}
                          onChange={() => { setRecipientType("parent"); setSelectedRecipients([]); }} /> Phụ huynh
                      </label>
                    </div>
                    
                    <select className="recipient-filter" value={recipientFilter}
                      onChange={(e) => {
                        setRecipientFilter(e.target.value);
                        setSelectedRecipients([]);
                        if (e.target.value !== "all") setShowDropdownList(true);
                        else setShowDropdownList(false);
                      }}
                    >
                      <option value="all">Toàn bộ các tuyến</option>
                      {availableRoutes.map((route) => (
                          <option key={route.id} value={route.id}>{route.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Danh sách người nhận */}
                  {(showDropdownList || recipientFilter !== "all") && (
                     <>
                      {showDropdownList ? (
                        <div className="parent-dropdown-wrapper">
                          <div className="parent-header">
                            <label className="select-all-checkbox-label">
                              <input type="checkbox" style={{ accentColor: "black" }}
                                onChange={handleSelectAll}
                                checked={currentList.length > 0 && selectedRecipients.length >= currentList.length}
                              /> Chọn tất cả
                            </label>
                            <span className="selected-count-inline">
                              {selectedRecipients.length} đã chọn
                            </span>
                          </div>
                          <div className="parent-list">
                            {currentList.length === 0 ? (
                                <p className="no-parents">Không tìm thấy người nhận.</p>
                            ) : (
                                currentList.map((item) => (
                                <label key={item.uniqueKey} className="parent-checkbox-label">
                                    <input type="checkbox" style={{ accentColor: "black" }}
                                    checked={selectedRecipients.includes(item.id)}
                                    onChange={() => handleSelectOne(item.id)}
                                    />
                                    <div className="parent-info">
                                        <strong>{item.name}</strong> 
                                        <div style={{fontSize: '0.85em', color: '#666'}}>{item.subInfo}</div>
                                    </div>
                                </label>
                                ))
                            )}
                          </div>
                        </div>
                      ) : (
                        <button type="button" className="parent-selected-btn" onClick={() => setShowDropdownList(true)}>
                          {selectedRecipients.length > 0 ? `Đã chọn: ${selectedRecipients.length} người` : "Chọn người cụ thể"}
                        </button>
                      )}
                     </>
                  )}
                </div>
              </div>

              <div className="compose-field">
                <label>Tiêu đề:</label>
                <input className="compose-input" placeholder="Nhập tiêu đề..." value={messageTitle} onChange={(e) => setMessageTitle(e.target.value)} />
              </div>

              <div className="compose-field">
                <label>Nội dung:</label>
                <textarea className="compose-textarea" placeholder="Nhập nội dung tin nhắn..." rows="8" value={messageContent} onChange={(e) => setMessageContent(e.target.value)} />
              </div>

            </div>

            <div className="compose-actions">
              <button className="btn-send" onClick={() => handleSendMessage(false)}>Gửi</button>
              <button className="btn-schedule" onClick={() => {setShowComposeModal(false); setShowScheduleModal(true)}}>
                <span>📅</span> Lên lịch gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lên Lịch Gửi */}
      {showScheduleModal && (
        <div className="message-modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="message-schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-header">
              <h2>Lên lịch gửi tin nhắn</h2>
              <button className="close-modal-btn" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>

            <div className="schedule-body">
              <div className="schedule-field">
                <label>Ngày gửi:</label>
                <input type="date" className="schedule-input" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
              </div>

              <div className="schedule-field">
                <label>Giờ gửi:</label>
                <input type="time" className="schedule-input" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
              </div>

              <div className="schedule-summary">
                <h3>Thông tin tin nhắn:</h3>
                {/* [ĐÃ REVERT] Về format đơn giản */}
                <p><strong>Gửi đến:</strong> {recipientType === "driver" ? "Tài xế" : "Phụ huynh"} - {selectedRecipients.length > 0 ? `${selectedRecipients.length} người` : "Toàn bộ"}</p>
                <p><strong>Tiêu đề:</strong> {messageTitle || "(Chưa có)"}</p>
              </div>
            </div>

            <div className="schedule-actions">
              <button className="btn-cancel" onClick={() => setShowScheduleModal(false)}>Hủy</button>
              <button className="btn-confirm" onClick={() => handleSendMessage(true)}>Xác nhận lên lịch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}