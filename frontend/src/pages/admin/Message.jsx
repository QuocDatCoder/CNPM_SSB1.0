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
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
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

  // 1. Load Tin nhắn khi đổi tab
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

      // --- BƯỚC 1: Xử lý Routes (Tạo danh sách tuyến chuẩn) ---
      const fullRoutes = routesData.map((route) => ({
          id: parseInt(route.id, 10), // Ép về số nguyên
          name: route.name, 
      }));
      setAvailableRoutes(fullRoutes); // Lưu vào state

      // Lấy danh sách ID các tuyến (ví dụ: [1, 2, 3, 4...]) để dùng gán random
      const routeIds = fullRoutes.map(r => r.id); 

      // --- BƯỚC 2: Xử lý Students (CÓ MOCK DATA) ---
      const mappedStudents = studentsData.map((student, index) => {
        let realRouteId = parseInt(student.current_route_id || 0, 10);
        
        // Nếu không có tuyến, gán random để test
        if (realRouteId === 0 && routeIds.length > 0) {
            realRouteId = routeIds[index % routeIds.length];
        }

        return {
          id: student.id,
          fullname: student.ho_ten,
          routeId: realRouteId,
          routeName: student.tuyen_duong || `Tuyến (Gán tạm) ${realRouteId}`,
          parentId: student.id,
          parentName: student.ten_phu_huynh || `Phụ huynh em ${student.ho_ten}`,
          parentPhone: student.sdt_phu_huynh,
        };
      });
      setStudentsList(mappedStudents);

      // --- BƯỚC 3: Xử lý Drivers (CÓ MOCK DATA - FIX LỖI TÀI XẾ) ---
      const mappedDrivers = driversData.map((driver, index) => {
        // Lấy routeId từ API
        let realRouteId = parseInt(driver.route_id || driver.current_route_id || 0, 10);

        // MOCK DATA: Nếu API trả về 0, tự động gán tài xế vào các tuyến có sẵn
        // Tài xế 1 -> Tuyến 1, Tài xế 2 -> Tuyến 2... xoay vòng
        if (realRouteId === 0 && routeIds.length > 0) {
            realRouteId = routeIds[index % routeIds.length];
        }

        return {
            id: driver.id, 
            fullname: driver.fullname,
            routeId: realRouteId, // ID đã được gán giả lập
            routeName: driver.routeName || driver.tuyen_duong || `Tuyến (Gán tạm) ${realRouteId}`, 
        };
      });
      
      // LOG KIỂM TRA: Bạn mở F12 xem dòng này, nếu thấy số [1, 2, 3...] là thành công
      console.log("🔥 Tài xế sau khi gán tuyến:", mappedDrivers.map(d => ({Ten: d.fullname, Tuyen: d.routeId})));
      
      setDriversList(mappedDrivers);

    } catch (error) {
      console.error("Lỗi tải dữ liệu metadata:", error);
    }
  };

// Trong Message.jsx

const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await NotificationService.getMessages(activeCategory);
      
      console.log(`📥 API Response (${activeCategory}):`, res); // Debug xem server trả về gì

      let list = [];
      
      // Trường hợp 1: API trả về mảng trực tiếp [ ... ]
      if (Array.isArray(res)) {
          list = res;
      } 
      // Trường hợp 2: API trả về object { data: [...] } (Code backend của bạn đang trả kiểu này)
      else if (res.data && Array.isArray(res.data)) {
          list = res.data;
      }
      // Trường hợp 3: Axios wrapper { data: { data: [...] } } (Đôi khi axios bọc thêm 1 lớp)
      else if (res.data?.data && Array.isArray(res.data.data)) {
          list = res.data.data;
      }

      setMessages(list);
    } catch (error) {
      console.error("Lỗi tải tin nhắn:", error);
      setMessages([]);
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
        const filterId = parseInt(recipientFilter, 10);
        
        console.log(`📌 --- DEBUG KIỂM TRA DỮ LIỆU ---`);
        console.log(`🔍 Bạn đang chọn lọc Route ID: ${filterId}`);
        
        // Kiểm tra xem trong danh sách có ai có routeId này không
        const checkData = studentsList.map(s => s.routeId);
        console.log("📊 Danh sách Route ID của tất cả học sinh trong RAM:", checkData);

        // In ra 3 học sinh đầu tiên để soi dữ liệu
        if (studentsList.length > 0) {
            console.log("👤 Soi học sinh đầu tiên:", {
                ten: studentsList[0].fullname,
                routeId_Goc: studentsList[0].routeId, // Giá trị sau khi map
                Khop_Filter_Khong: studentsList[0].routeId === filterId
            });
        }

        filteredStudents = studentsList.filter(s => s.routeId === filterId);
        console.log(`✅ Kết quả sau khi lọc: ${filteredStudents.length}`);
      }

      list = filteredStudents.map(s => ({
          id: s.parentId,
          name: s.parentName, 
          subInfo: `Con: ${s.fullname} ${s.routeName ? `(${s.routeName})` : ''}`,
          uniqueKey: `parent_student_${s.id}` 
      }));

    } else if (recipientType === 'driver') {
        // ... (giữ nguyên logic tài xế)
        if (recipientFilter === 'all') {
            list = driversList.map(d => ({
                id: d.id,
                name: d.fullname,
                subInfo: d.routeName,
                uniqueKey: `driver_${d.id}`
            }));
        } else {
            list = [];
        }
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
      const allIds = currentList.map(item => item.id);
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
     } catch(e) { console.error(e); }
  };

  const handleDeleteMessage = async (id) => {
    if(!window.confirm("Xóa tin nhắn này?")) return;
    try {
        await NotificationService.deleteMessage(id);
        setMessages(prev => prev.filter(m => m.id !== id));
    } catch(e) { alert("Lỗi khi xóa tin nhắn"); }
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
    } catch(e) { alert("Có lỗi khi xóa danh sách tin nhắn"); }
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

    let finalRecipients = [];

    // --- CHANGE: Xử lý logic lấy người nhận ---
    
    // TRƯỜNG HỢP 1: Tài xế + Chọn tuyến cụ thể (Tự động tìm tài xế)
    if (recipientType === 'driver' && recipientFilter !== 'all') {
        // Ép về số để tìm
        const routeIdToFind = parseInt(recipientFilter, 10);
        
        // Tìm tài xế có routeId trùng khớp (dạng số)
        const targetDriver = driversList.find(d => d.routeId === routeIdToFind);
        
        if (targetDriver) {
            finalRecipients = [targetDriver.id];
        } else {
            return alert(`Không tìm thấy tài xế nào chạy tuyến số ${routeIdToFind}!`);
        }
    }
    // TRƯỜNG HỢP 2: Chọn thủ công (Tài xế All hoặc Phụ huynh)
    else {
        finalRecipients = selectedRecipients;
        // Nếu không tick ai cả, mặc định gửi cho tất cả trong danh sách lọc hiện tại
        if (finalRecipients.length === 0 && currentList.length > 0) {
             // Với phụ huynh, nếu chọn tuyến mà ko tick ai -> gửi cả tuyến
             // Với tài xế all -> gửi tất cả tài xế
             if (window.confirm(`Bạn chưa chọn người cụ thể. Bạn có muốn gửi cho toàn bộ ${currentList.length} người trong danh sách không?`)) {
                finalRecipients = currentList.map(r => r.id);
             } else {
                return;
             }
        }
    }

    if (finalRecipients.length === 0) return alert("Không tìm thấy người nhận phù hợp!");

    const payload = {
      recipient_ids: finalRecipients,
      subject: messageTitle,
      content: messageContent,
      schedule_time: isScheduled ? `${scheduleDate} ${scheduleTime}` : null,
      type: 'tinnhan' 
    };

    try {
      await NotificationService.sendMessage(payload);
      alert(isScheduled ? "Đã lên lịch thành công!" : "Đã gửi tin nhắn!");
      
      setShowComposeModal(false);
      setShowScheduleModal(false);
      setMessageTitle("");
      setMessageContent("");
      setSelectedRecipients([]);

      if (activeCategory === 'sent' || activeCategory === 'scheduled') {
          loadMessages();
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || "Lỗi server khi gửi tin.";
      alert("Gửi lỗi: " + errMsg);
    }
  };

  const formatDate = (dateStr) => {
      if(!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("vi-VN", {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'});
  }

  // Helper hiển thị tên tuyến đang chọn
  const getSelectedRouteName = () => {
      const r = availableRoutes.find(r => r.id === parseInt(recipientFilter));
      return r ? r.name : "";
  };

  return (
    <div className="message-page">
      <Header title="Tin nhắn" />

      <div className="message-container">
        {/* Sidebar (Giữ nguyên) */}
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
             {!loading && filteredMessages.length === 0 && (
                 <p style={{padding: 20, color: '#999'}}>Không có tin nhắn nào.</p>
             )}
             {!loading && filteredMessages.map((message) => (
              <div key={message.id} className={`message-item ${message.read ? '' : 'unread'}`}>
                <input type="checkbox" className="message-checkbox"
                  checked={selectedMessages.includes(message.id)} onChange={() => handleSelectMessage(message.id)} />
                <button className={`star-btn ${message.starred ? "starred" : ""}`} onClick={() => handleToggleStar(message.id)}>
                  {message.starred ? "★" : "☆"}
                </button>
                <div className="message-info">
                  <span className="message-sender">
                    {activeCategory === 'sent' ? `Tới: ${message.receiver}` : `Từ: ${message.sender}`}
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
                          onChange={() => { 
                              setRecipientType("driver"); 
                              setSelectedRecipients([]); 
                              setShowDropdownList(false);
                          }} /> Tài xế
                      </label>
                      <label className="radio-label">
                        <input type="radio" name="recipient-type" value="parent"
                          checked={recipientType === "parent"}
                          style={{ accentColor: "black" }}
                          onChange={() => { 
                              setRecipientType("parent"); 
                              setSelectedRecipients([]); 
                          }} /> Phụ huynh
                      </label>
                    </div>
                    
                    {/* --- CHANGE: Luôn hiện combobox chọn tuyến cho cả Tài xế và Phụ huynh --- */}
                    <select className="recipient-filter" value={recipientFilter}
                        onChange={(e) => {
                            setRecipientFilter(e.target.value);
                            setSelectedRecipients([]);
                            // Nếu là Parent + chọn tuyến -> Mở dropdown list
                            if (recipientType === "parent" && e.target.value !== "all") {
                                setShowDropdownList(true);
                            } else {
                                setShowDropdownList(false);
                            }
                        }}
                    >
                        <option value="all">Toàn bộ các tuyến</option>
                        {availableRoutes.map((route) => (
                            <option key={route.id} value={route.id}>{route.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* Danh sách người nhận */}
                  <div className="recipient-dropdown-area">
                      
                      {/* CASE 1: TÀI XẾ + CHỌN TUYẾN -> Hiện thông báo tự động */}
                      {recipientType === "driver" && recipientFilter !== "all" ? (
                          <div className="auto-select-message" style={{marginTop: 10, padding: 10, background: '#e8f5e9', borderRadius: 4, color: '#2e7d32'}}>
                              <i className="fa fa-check-circle"></i> Hệ thống tự động chọn tài xế tuyến: <strong>{availableRoutes.find(r=>r.id == recipientFilter)?.name}</strong>
                          </div>
                      ) : (
                          
                      /* CASE 2: PHỤ HUYNH HOẶC TÀI XẾ (ALL) -> Hiện Dropdown chọn người */
                          <div className="parent-dropdown-wrapper" style={{marginTop: 10, border: '1px solid #ddd', borderRadius: 4}}>
                            <div className="parent-header" style={{padding: '8px 10px', background: '#f9f9f9', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between'}}>
                                <label className="select-all-checkbox-label" style={{cursor: 'pointer'}}>
                                  <input type="checkbox" style={{ accentColor: "#007bff", marginRight: 8 }}
                                    onChange={handleSelectAll}
                                    checked={currentList.length > 0 && selectedRecipients.length >= currentList.length}
                                  /> 
                                  <strong>Chọn tất cả ({currentList.length})</strong>
                                </label>
                                <span style={{fontSize: '0.9em', color: '#666'}}>
                                  Đã chọn: {selectedRecipients.length}
                                </span>
                            </div>

                            <div className="parent-list" style={{maxHeight: '250px', overflowY: 'auto', padding: 10}}>
                                {currentList.length === 0 ? (
                                    <div style={{textAlign: 'center', color: '#999', padding: 20}}>
                                        {recipientType === 'parent' 
                                            ? "Không tìm thấy phụ huynh nào trong tuyến này." 
                                            : "Không có dữ liệu."}
                                    </div>
                                ) : (
                                    currentList.map((item) => (
                                    <div key={item.uniqueKey} className="parent-item" style={{display: 'flex', alignItems: 'center', marginBottom: 10, paddingBottom: 5, borderBottom: '1px dashed #eee'}}>
                                        <input type="checkbox" style={{ accentColor: "#007bff", transform: 'scale(1.2)', marginRight: 10, cursor: 'pointer' }}
                                            checked={selectedRecipients.includes(item.id)}
                                            onChange={() => handleSelectOne(item.id)}
                                        />
                                        <div className="parent-info" onClick={() => handleSelectOne(item.id)} style={{cursor: 'pointer', flex: 1}}>
                                            <div style={{fontWeight: 600, color: '#333'}}>{item.name}</div> 
                                            <div style={{fontSize: '0.85em', color: '#666'}}>{item.subInfo}</div>
                                        </div>
                                    </div>
                                    ))
                                )}
                            </div>
                          </div>
                      )}
                  </div>
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
              <button className="btn-send" onClick={() => handleSendMessage(false)}>Gửi ngay</button>
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
                <p><strong>Gửi đến:</strong> 
                   {recipientType === "driver" 
                      ? (recipientFilter !== 'all' ? ` Tài xế tuyến ${getSelectedRouteName()}` : " Tất cả tài xế")
                      : ` Phụ huynh (${selectedRecipients.length} người)`
                   }
                </p>
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