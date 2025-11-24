import React, { useState } from "react";
import Header from "../../components/common/Header/header";
import "./Schedule.css";

const scheduleData = [];

// Generate real calendar for any month/year
const generateCalendar = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay(); // 0 (Sunday) - 6 (Saturday)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
};

const monthNames = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

export default function Schedule() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [schedules, setSchedules] = useState(scheduleData);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [activeShiftFilter, setActiveShiftFilter] = useState("di"); // 'di' or 've'
  const [newSchedule, setNewSchedule] = useState({
    route_id: "",
    driver_id: "",
    bus_id: "",
    ngay_chay: "",
    shift: "", // 'di' or 've'
    trang_thai: "chuabatdau",
  });
  const [editSchedule, setEditSchedule] = useState({
    id: null,
    route_id: "",
    route: "",
    street: "",
    driver_id: "",
    bus_id: "",
    ngay_chay: "",
    shift: "",
    createDate: "",
  });

  const { firstDay, daysInMonth } = generateCalendar(currentYear, currentMonth);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Format date for display
  const getFormattedDate = () => {
    const date = selectedDate
      ? new Date(currentYear, currentMonth, selectedDate)
      : today;

    const dayNames = [
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ];
    const dayOfWeek = dayNames[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${dayOfWeek}, Ngày ${day}, Tháng ${month}, Năm ${year}`;
  };

  // Format time from ISO string to display
  const formatCreatedTime = (isoString) => {
    if (!isoString) return "--:--";
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Format date and time for history display
  const formatHistoryTime = (isoString) => {
    if (!isoString) return "--:-- --/--";
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${hours}:${minutes} ${day}/${month}`;
  };

  // Get assignment history for selected date and shift
  const getAssignmentHistoryForDate = () => {
    if (!selectedDate) return [];

    const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(selectedDate).padStart(2, "0")}`;

    return assignmentHistory
      .filter(
        (h) =>
          h.ngay_chay === selectedDateStr &&
          h.shift === (activeShiftFilter === "di" ? "Lượt đi" : "Lượt về")
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Get available routes for selected date (filter out fully booked routes)
  const getAvailableRoutes = () => {
    const routes = [
      { id: "1", name: "Tuyến 1 - An Dương Vương" },
      { id: "2", name: "Tuyến 2 - Lê Lợi" },
      { id: "3", name: "Tuyến 3 - Nguyễn Huệ" },
      { id: "4", name: "Tuyến 4 - Trường Chinh" },
      { id: "5", name: "Tuyến 5 - Võ Văn Kiệt" },
      { id: "6", name: "Tuyến 6 - Cách Mạng Tháng 8" },
    ];

    return routes.filter((route) => {
      const routeSchedules = schedules.filter(
        (s) => s.route_id === route.id && s.ngay_chay === newSchedule.ngay_chay
      );
      // Show route if it has less than 2 schedules (not both shifts booked)
      return routeSchedules.length < 2;
    });
  };

  // Get schedules for selected date only
  const getSchedulesForDate = () => {
    if (!selectedDate) return schedules;

    const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(selectedDate).padStart(2, "0")}`;
    return schedules.filter((s) => s.ngay_chay === selectedDateStr);
  };

  // Check if driver is already assigned to a shift on the selected date
  const isDriverAssigned = (driverId) => {
    if (!driverId || !newSchedule.ngay_chay || !newSchedule.shift) return false;

    return schedules.some(
      (s) =>
        s.driver_id === driverId &&
        s.ngay_chay === newSchedule.ngay_chay &&
        s.shift === (newSchedule.shift === "di" ? "Lượt đi" : "Lượt về")
    );
  };

  // Check if bus is already assigned to a shift on the selected date
  const isBusAssigned = (busId) => {
    if (!busId || !newSchedule.ngay_chay || !newSchedule.shift) return false;

    return schedules.some(
      (s) =>
        s.bus_id === busId &&
        s.ngay_chay === newSchedule.ngay_chay &&
        s.shift === (newSchedule.shift === "di" ? "Lượt đi" : "Lượt về")
    );
  };

  // Check if driver is already assigned (for edit mode)
  const isDriverAssignedForEdit = (driverId) => {
    if (!driverId || !editSchedule.ngay_chay || !editSchedule.shift)
      return false;

    const shiftDisplay = editSchedule.shift === "di" ? "Lượt đi" : "Lượt về";

    return schedules.some(
      (s) =>
        s.id !== editSchedule.id && // Exclude current schedule
        s.driver_id === driverId &&
        s.ngay_chay === editSchedule.ngay_chay &&
        s.shift === shiftDisplay
    );
  };

  // Check if bus is already assigned (for edit mode)
  const isBusAssignedForEdit = (busId) => {
    if (!busId || !editSchedule.ngay_chay || !editSchedule.shift) return false;

    const shiftDisplay = editSchedule.shift === "di" ? "Lượt đi" : "Lượt về";

    return schedules.some(
      (s) =>
        s.id !== editSchedule.id && // Exclude current schedule
        s.bus_id === busId &&
        s.ngay_chay === editSchedule.ngay_chay &&
        s.shift === shiftDisplay
    );
  };

  const handleAddSchedule = () => {
    // Validate selected date
    if (!selectedDate) {
      alert("Vui lòng chọn ngày trong lịch trước khi thêm lịch trình!");
      return;
    }

    // Check if selected date >= today
    const selectedDateObj = new Date(currentYear, currentMonth, selectedDate);
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0); // Reset time to compare only date

    if (selectedDateObj < todayObj) {
      alert("Không thể thêm lịch trình cho ngày trong quá khứ!");
      return;
    }

    const defaultDate = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(selectedDate).padStart(2, "0")}`;

    setNewSchedule({
      route_id: "",
      driver_id: "",
      bus_id: "",
      ngay_chay: defaultDate,
      shift: "di", // Default shift
      trang_thai: "chuabatdau",
    });

    setShowAddModal(true);
  };

  // Check if route has schedule on date and determine available shift
  const getAvailableShift = (routeId, date) => {
    const existingSchedule = schedules.find(
      (s) => s.route_id === routeId && s.ngay_chay === date
    );

    if (!existingSchedule) return "di"; // Default to 'di' if no schedule exists
    return existingSchedule.shift === "Lượt đi" ? "ve" : "di";
  };

  // Handle route change to auto-set shift
  const handleRouteChange = (routeId) => {
    const autoShift = getAvailableShift(routeId, newSchedule.ngay_chay);
    setNewSchedule({
      ...newSchedule,
      route_id: routeId,
      shift: autoShift,
      driver_id: "", // Reset driver
      bus_id: "", // Reset bus
    });
  };

  // Handle shift change
  const handleShiftChange = (shift) => {
    setNewSchedule({
      ...newSchedule,
      shift: shift,
    });
  };

  const handleSaveSchedule = () => {
    // Validation - only route, date, and shift are required
    if (!newSchedule.route_id || !newSchedule.ngay_chay || !newSchedule.shift) {
      alert(
        "Vui lòng điền đầy đủ thông tin bắt buộc (Tuyến đường, Ngày chạy, Chuyến)!"
      );
      return;
    }

    // Check if driver is already assigned to another route on same date and shift
    if (newSchedule.driver_id) {
      const driverConflict = schedules.find(
        (s) =>
          s.driver_id === newSchedule.driver_id &&
          s.ngay_chay === newSchedule.ngay_chay &&
          s.shift === (newSchedule.shift === "di" ? "Lượt đi" : "Lượt về")
      );
      if (driverConflict) {
        alert(
          `Tài xế này đã được phân công cho ${driverConflict.route} (${driverConflict.shift}) trong ngày này!`
        );
        return;
      }
    }

    // Check if bus is already assigned to another route on same date and shift
    if (newSchedule.bus_id) {
      const busConflict = schedules.find(
        (s) =>
          s.bus_id === newSchedule.bus_id &&
          s.ngay_chay === newSchedule.ngay_chay &&
          s.shift === (newSchedule.shift === "di" ? "Lượt đi" : "Lượt về")
      );
      if (busConflict) {
        alert(
          `Xe bus này đã được sử dụng cho ${busConflict.route} (${busConflict.shift}) trong ngày này!`
        );
        return;
      }
    }

    // Route names mapping
    const routeNames = {
      1: { name: "Tuyến số 1", street: "Đường An Dương Vương" },
      2: { name: "Tuyến số 2", street: "Đường Lê Lợi" },
      3: { name: "Tuyến số 3", street: "Đường Nguyễn Huệ" },
      4: { name: "Tuyến số 4", street: "Đường Trường Chinh" },
      5: { name: "Tuyến số 5", street: "Đường Võ Văn Kiệt" },
      6: { name: "Tuyến số 6", street: "Đường Cách Mạng Tháng 8" },
    };

    // Create new schedule entry
    const createdAt = new Date().toISOString();
    const newEntry = {
      id: schedules.length + 1,
      route: routeNames[newSchedule.route_id].name,
      route_id: newSchedule.route_id,
      street: routeNames[newSchedule.route_id].street,
      createDate: new Date(newSchedule.ngay_chay).toLocaleDateString("vi-VN"),
      shift: newSchedule.shift === "di" ? "Lượt đi" : "Lượt về",
      time: "--:--", // Will be set when schedule starts
      status: newSchedule.driver_id ? "Thay đổi" : "Phân công",
      driver_id: newSchedule.driver_id,
      bus_id: newSchedule.bus_id,
      ngay_chay: newSchedule.ngay_chay,
      trang_thai: newSchedule.trang_thai,
      created_at: createdAt,
    };

    setSchedules([...schedules, newEntry]);

    // Add to history
    const historyEntry = {
      id: assignmentHistory.length + 1,
      route: routeNames[newSchedule.route_id].name,
      timestamp: createdAt,
      action: "Thêm",
      ngay_chay: newSchedule.ngay_chay,
      shift: newSchedule.shift === "di" ? "Lượt đi" : "Lượt về",
    };
    setAssignmentHistory([...assignmentHistory, historyEntry]);

    setShowAddModal(false);
    alert("Thêm lịch trình thành công!");

    console.log("Saving schedule:", newEntry);
    // TODO: Call API to save schedule
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setNewSchedule({
      route_id: "",
      driver_id: "",
      bus_id: "",
      ngay_chay: "",
      shift: "",
      trang_thai: "chuabatdau",
    });
  };

  const handleDeleteSchedule = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch trình này?")) {
      setSchedules(schedules.filter((schedule) => schedule.id !== id));
      alert("Đã xóa lịch trình!");
    }
  };

  const handleStatusClick = (id, status) => {
    const schedule = schedules.find((s) => s.id === id);
    if (!schedule) return;

    setEditSchedule({
      id: schedule.id,
      route_id: schedule.route_id,
      route: schedule.route,
      street: schedule.street,
      driver_id: schedule.driver_id || "",
      bus_id: schedule.bus_id || "",
      ngay_chay: schedule.ngay_chay,
      shift: schedule.shift === "L\u01b0\u1ee3t \u0111i" ? "di" : "ve",
      createDate: schedule.createDate,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    // Check if driver is already assigned to another route on same date and shift
    if (editSchedule.driver_id) {
      const driverConflict = schedules.find(
        (s) =>
          s.id !== editSchedule.id &&
          s.driver_id === editSchedule.driver_id &&
          s.ngay_chay === editSchedule.ngay_chay &&
          s.shift === editSchedule.shift
      );
      if (driverConflict) {
        alert(
          `Tài xế này đã được phân công cho ${driverConflict.route} (${driverConflict.shift}) trong ngày này!`
        );
        return;
      }
    }

    // Check if bus is already assigned to another route on same date and shift
    if (editSchedule.bus_id) {
      const busConflict = schedules.find(
        (s) =>
          s.id !== editSchedule.id &&
          s.bus_id === editSchedule.bus_id &&
          s.ngay_chay === editSchedule.ngay_chay &&
          s.shift === editSchedule.shift
      );
      if (busConflict) {
        alert(
          `Xe bus này đã được sử dụng cho ${busConflict.route} (${busConflict.shift}) trong ngày này!`
        );
        return;
      }
    }

    // Update schedule
    const updatedSchedules = schedules.map((s) => {
      if (s.id === editSchedule.id) {
        return {
          ...s,
          driver_id: editSchedule.driver_id,
          bus_id: editSchedule.bus_id,
          status:
            editSchedule.driver_id && editSchedule.bus_id
              ? "Thay đổi"
              : "Phân công",
        };
      }
      return s;
    });

    setSchedules(updatedSchedules);

    // Add to history
    const action =
      editSchedule.driver_id && editSchedule.bus_id ? "Thay đổi" : "Phân công";
    const historyEntry = {
      id: assignmentHistory.length + 1,
      route: editSchedule.route,
      timestamp: new Date().toISOString(),
      action: action,
      ngay_chay: editSchedule.ngay_chay,
      shift: editSchedule.shift === "di" ? "Lượt đi" : "Lượt về",
    };
    setAssignmentHistory([...assignmentHistory, historyEntry]);

    setShowEditModal(false);
    alert("Cập nhật lịch trình thành công!");

    console.log("Updated schedule:", editSchedule);
    // TODO: Call API to update schedule
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditSchedule({
      id: null,
      route_id: "",
      route: "",
      street: "",
      driver_id: "",
      bus_id: "",
      ngay_chay: "",
      shift: "",
      createDate: "",
    });
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  return (
    <div className="schedule-page">
      <Header title="Lịch trình" />

      <div className="schedule-content">
        <div className="schedule-layout">
          {/* Left Section - Calendar */}
          <div className="left-section">
            <div className="calendar-section">
              <div className="calendar-header">
                <h3>Lịch</h3>
              </div>

              <div className="month-selector">
                <button className="month-nav-btn" onClick={handlePrevMonth}>
                  ‹
                </button>
                <button className="month-btn active">
                  {monthNames[currentMonth]} {currentYear}
                </button>
                <button className="month-nav-btn" onClick={handleNextMonth}>
                  ›
                </button>
              </div>

              <div className="calendar">
                <div className="calendar-weekdays">
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(
                    (day, idx) => (
                      <div key={idx} className="weekday">
                        {day}
                      </div>
                    )
                  )}
                </div>

                <div className="calendar-days">
                  {/* Empty cells for offset */}
                  {[...Array(firstDay)].map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="calendar-day empty"
                    ></div>
                  ))}

                  {/* Days of month */}
                  {calendarDays.map((day) => (
                    <div
                      key={day}
                      className={`calendar-day ${
                        day === selectedDate ? "selected" : ""
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Assignment Summary */}
            </div>
            <div className="assignment-summary">
              <div className="summary-header">
                <h4>Bảng lịch sự phân công</h4>
                <div className="date-filter">
                  <button
                    className={`filter-btn ${
                      activeShiftFilter === "di" ? "active" : ""
                    }`}
                    onClick={() => setActiveShiftFilter("di")}
                  >
                    Lượt đi
                  </button>
                  <button
                    className={`filter-btn ${
                      activeShiftFilter === "ve" ? "active" : ""
                    }`}
                    onClick={() => setActiveShiftFilter("ve")}
                  >
                    Lượt về
                  </button>
                  <span className="date-display">
                    {selectedDate || new Date().getDate()}/{currentMonth + 1}
                  </span>
                </div>
              </div>

              <div className="assignment-list">
                {getAssignmentHistoryForDate().length === 0 ? (
                  <div className="empty-history">
                    <p>Chưa có lịch sử phân công</p>
                  </div>
                ) : (
                  getAssignmentHistoryForDate().map((item) => (
                    <div key={item.id} className="assignment-item">
                      <div className="assignment-info">
                        <span className="route-label">{item.route}</span>
                        <span className="time">
                          {formatHistoryTime(item.timestamp)}
                        </span>
                        <span className="status">{item.action}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Work Table */}
          <div className="right-section">
            <div className="work-section">
              <div className="work-header">
                <div className="date-display-header">{getFormattedDate()}</div>
              </div>

              <div className="work-title">
                <h3>Bảng Phân Công Công Việc</h3>
                <button className="add-work-btn" onClick={handleAddSchedule}>
                  +
                </button>
              </div>

              <div className="work-table">
                {getSchedulesForDate().map((item, index) => (
                  <div
                    key={item.id}
                    className={`table-row-schedule ${
                      index % 2 === 0 ? "even" : "odd"
                    }`}
                  >
                    <div className="col col-route">{item.route}</div>
                    <div className="col col-street">{item.street}</div>
                    <div className="col col-create-date">{item.createDate}</div>
                    <div className="col col-shift">{item.shift}</div>
                    <div className="col col-time">
                      {formatCreatedTime(item.created_at)}
                    </div>
                    <div className="col col-status">
                      <button
                        className={`status-btn ${
                          item.status === "Phân công" ? "pending" : "assigned"
                        }`}
                        onClick={() => handleStatusClick(item.id, item.status)}
                      >
                        {item.status}
                      </button>
                    </div>
                    <div className="col col-action">
                      <button
                        className={`delete-btn-schedule ${
                          index % 2 === 0 ? "light" : "dark"
                        }`}
                        onClick={() => handleDeleteSchedule(item.id)}
                        title="Xóa lịch trình"
                      >
                        <img src="/icons/backspace.png" alt="Xóa lịch trình" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal thêm lịch trình mới */}
      {showAddModal && (
        <div className="schedule-modal-overlay" onClick={handleCancelAdd}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <h2>Thêm lịch trình mới</h2>
              <button
                className="schedule-modal-close"
                onClick={handleCancelAdd}
              >
                ×
              </button>
            </div>

            <div className="schedule-modal-body">
              <div className="schedule-form-group">
                <label className="schedule-form-label">
                  Chuyến <span className="required">*</span>
                </label>
                <div className="schedule-radio-group">
                  <label className="schedule-radio-label">
                    <input
                      type="radio"
                      name="shift"
                      value="di"
                      checked={newSchedule.shift === "di"}
                      onChange={(e) => handleShiftChange(e.target.value)}
                    />
                    <span>Lượt đi</span>
                  </label>
                  <label className="schedule-radio-label">
                    <input
                      type="radio"
                      name="shift"
                      value="ve"
                      checked={newSchedule.shift === "ve"}
                      onChange={(e) => handleShiftChange(e.target.value)}
                    />
                    <span>Lượt về</span>
                  </label>
                </div>
              </div>

              <div className="schedule-form-group">
                <label className="schedule-form-label">
                  Tuyến đường <span className="required">*</span>
                </label>
                <select
                  className="schedule-form-input"
                  value={newSchedule.route_id}
                  onChange={(e) => handleRouteChange(e.target.value)}
                >
                  <option value="">-- Chọn tuyến đường --</option>
                  {getAvailableRoutes().map((route) => {
                    const existingSchedule = schedules.find(
                      (s) =>
                        s.route_id === route.id &&
                        s.ngay_chay === newSchedule.ngay_chay &&
                        s.shift ===
                          (newSchedule.shift === "di" ? "Lượt đi" : "Lượt về")
                    );
                    const isDisabled = !!existingSchedule;

                    return (
                      <option
                        key={route.id}
                        value={route.id}
                        disabled={isDisabled}
                      >
                        {route.name} {isDisabled ? "(Đã đặt)" : ""}
                      </option>
                    );
                  })}
                </select>
                {getAvailableRoutes().length === 0 && (
                  <p
                    className="schedule-helper-text"
                    style={{ color: "#ff6b6b" }}
                  >
                    Tất cả các tuyến đã được phân công cho ngày này!
                  </p>
                )}
              </div>

              <div className="schedule-form-group">
                <label className="schedule-form-label">Tài xế</label>
                <select
                  className="schedule-form-input"
                  value={newSchedule.driver_id}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      driver_id: e.target.value,
                    })
                  }
                >
                  <option value="">-- Chưa phân công tài xế --</option>
                  <option value="1" disabled={isDriverAssigned("1")}>
                    Nguyễn Văn A - 0901234567{" "}
                    {isDriverAssigned("1") ? "(Đã phân công)" : ""}
                  </option>
                  <option value="2" disabled={isDriverAssigned("2")}>
                    Trần Văn B - 0912345678{" "}
                    {isDriverAssigned("2") ? "(Đã phân công)" : ""}
                  </option>
                  <option value="3" disabled={isDriverAssigned("3")}>
                    Lê Văn C - 0923456789{" "}
                    {isDriverAssigned("3") ? "(Đã phân công)" : ""}
                  </option>
                  <option value="4" disabled={isDriverAssigned("4")}>
                    Phạm Văn D - 0934567890{" "}
                    {isDriverAssigned("4") ? "(Đã phân công)" : ""}
                  </option>
                </select>
                {/* <p className="schedule-helper-text">
                  Tài xế không bắt buộc. Nếu chưa chọn, trạng thái sẽ là 'Phân
                  công'
                </p> */}
              </div>

              <div className="schedule-form-group">
                <label className="schedule-form-label">Xe bus</label>
                <select
                  className="schedule-form-input"
                  value={newSchedule.bus_id}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, bus_id: e.target.value })
                  }
                >
                  <option value="">-- Chưa chọn xe bus --</option>
                  <option value="1" disabled={isBusAssigned("1")}>
                    59A-12345 - Toyota Coaster (29 chỗ){" "}
                    {isBusAssigned("1") ? "(Đã sử dụng)" : ""}
                  </option>
                  <option value="2" disabled={isBusAssigned("2")}>
                    60B-23456 - Hyundai County (29 chỗ){" "}
                    {isBusAssigned("2") ? "(Đã sử dụng)" : ""}
                  </option>
                  <option value="3" disabled={isBusAssigned("3")}>
                    61C-34567 - Thaco TB120S (29 chỗ){" "}
                    {isBusAssigned("3") ? "(Đã sử dụng)" : ""}
                  </option>
                  <option value="4" disabled={isBusAssigned("4")}>
                    62D-45678 - Samco Felix (29 chỗ){" "}
                    {isBusAssigned("4") ? "(Đã sử dụng)" : ""}
                  </option>
                </select>
                {/* <p className="schedule-helper-text">
                  Xe bus không bắt buộc. Có thể phân công sau
                </p> */}
              </div>

              <div className="schedule-form-group">
                <label className="schedule-form-label">
                  Ngày chạy <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="schedule-form-input schedule-readonly"
                  value={newSchedule.ngay_chay}
                  readOnly
                />
                {/* <p className="schedule-helper-text">
                  Ngày được chọn từ lịch. Trạng thái mặc định:{" "}
                  <strong>Chưa bắt đầu</strong>
                </p> */}
              </div>

              <div className="schedule-info-note">
                <strong>Lưu ý:</strong>
                <ul>
                  <li>
                    Chọn <strong>Chuyến</strong> (Lượt đi/Lượt về) trước, sau đó
                    chọn <strong>Tuyến đường</strong>
                  </li>
                  <li>
                    Tuyến đã được phân công cho chuyến đã chọn sẽ bị vô hiệu hóa
                  </li>
                  <li>
                    Khi cả 2 chuyến của một tuyến đã được tạo, tuyến đó sẽ không
                    hiển thị
                  </li>
                  <li>
                    <strong>Tài xế và xe bus không bắt buộc</strong> khi tạo
                    lịch mới
                  </li>
                  <li>
                    Một tài xế chỉ được phân công cho <strong>một tuyến</strong>{" "}
                    trong cùng một chuyến (đi hoặc về) trong cùng ngày
                  </li>
                  <li>
                    Một xe bus chỉ được sử dụng cho <strong>một tuyến</strong>{" "}
                    trong cùng một chuyến (đi hoặc về) trong cùng ngày
                  </li>
                  <li>Bảng phân công chỉ hiển thị lịch của ngày được chọn</li>
                  <li>Thời gian tạo lịch sẽ được hiển thị trên bảng</li>
                </ul>
              </div>
            </div>

            <div className="schedule-modal-footer">
              <button className="schedule-btn-cancel" onClick={handleCancelAdd}>
                Hủy
              </button>
              <button
                className="schedule-btn-save"
                onClick={handleSaveSchedule}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa lịch trình (Phân công/Thay đổi) */}
      {showEditModal && (
        <div className="schedule-modal-overlay" onClick={handleCancelEdit}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <h2>Phân công / Thay đổi lịch trình</h2>
              <button
                className="schedule-modal-close"
                onClick={handleCancelEdit}
              >
                ×
              </button>
            </div>

            <div className="schedule-modal-body">
              {/* Thông tin chỉ hiển thị (không cho sửa) */}
              <div className="schedule-form-group">
                <label className="schedule-form-label">Tuyến đường</label>
                <input
                  type="text"
                  className="schedule-form-input schedule-readonly"
                  value={`${editSchedule.route} - ${editSchedule.street}`}
                  readOnly
                />
              </div>

              <div className="schedule-form-group">
                <label className="schedule-form-label">Chuyến</label>
                <input
                  type="text"
                  className="schedule-form-input schedule-readonly"
                  value={editSchedule.shift === "di" ? "Lượt đi" : "Lượt về"}
                  readOnly
                />
              </div>

              <div className="schedule-form-group">
                <label className="schedule-form-label">Ngày chạy</label>
                <input
                  type="text"
                  className="schedule-form-input schedule-readonly"
                  value={editSchedule.createDate}
                  readOnly
                />
              </div>

              {/* Phần cho phép chỉnh sửa */}
              <div className="schedule-form-group">
                <label className="schedule-form-label">Tài xế</label>
                <select
                  className="schedule-form-input"
                  value={editSchedule.driver_id}
                  onChange={(e) =>
                    setEditSchedule({
                      ...editSchedule,
                      driver_id: e.target.value,
                    })
                  }
                >
                  <option value="">-- Chưa phân công tài xế --</option>
                  <option value="1" disabled={isDriverAssignedForEdit("1")}>
                    Nguyễn Văn A - 0901234567{" "}
                    {isDriverAssignedForEdit("1") ? "(Đã phân công)" : ""}
                  </option>
                  <option value="2" disabled={isDriverAssignedForEdit("2")}>
                    Trần Văn B - 0912345678{" "}
                    {isDriverAssignedForEdit("2") ? "(Đã phân công)" : ""}
                  </option>
                  <option value="3" disabled={isDriverAssignedForEdit("3")}>
                    Lê Văn C - 0923456789{" "}
                    {isDriverAssignedForEdit("3") ? "(Đã phân công)" : ""}
                  </option>
                  <option value="4" disabled={isDriverAssignedForEdit("4")}>
                    Phạm Văn D - 0934567890{" "}
                    {isDriverAssignedForEdit("4") ? "(Đã phân công)" : ""}
                  </option>
                </select>
              </div>

              <div className="schedule-form-group">
                <label className="schedule-form-label">Xe bus</label>
                <select
                  className="schedule-form-input"
                  value={editSchedule.bus_id}
                  onChange={(e) =>
                    setEditSchedule({ ...editSchedule, bus_id: e.target.value })
                  }
                >
                  <option value="">-- Chưa chọn xe bus --</option>
                  <option value="1" disabled={isBusAssignedForEdit("1")}>
                    59A-12345 - Toyota Coaster (29 chỗ){" "}
                    {isBusAssignedForEdit("1") ? "(Đã sử dụng)" : ""}
                  </option>
                  <option value="2" disabled={isBusAssignedForEdit("2")}>
                    60B-23456 - Hyundai County (29 chỗ){" "}
                    {isBusAssignedForEdit("2") ? "(Đã sử dụng)" : ""}
                  </option>
                  <option value="3" disabled={isBusAssignedForEdit("3")}>
                    61C-34567 - Thaco TB120S (29 chỗ){" "}
                    {isBusAssignedForEdit("3") ? "(Đã sử dụng)" : ""}
                  </option>
                  <option value="4" disabled={isBusAssignedForEdit("4")}>
                    62D-45678 - Samco Felix (29 chỗ){" "}
                    {isBusAssignedForEdit("4") ? "(Đã sử dụng)" : ""}
                  </option>
                </select>
              </div>

              <div className="schedule-info-note">
                <strong>Lưu ý:</strong>
                <ul>
                  <li>
                    Chỉ có thể phân công/thay đổi <strong>Tài xế</strong> và{" "}
                    <strong>Xe bus</strong>
                  </li>
                  <li>
                    Các thông tin khác (Tuyến, Chuyến, Ngày) không thể sửa đổi
                  </li>
                  <li>
                    Tài xế/Xe bus đã được phân công cho tuyến khác trong cùng
                    chuyến sẽ bị vô hiệu hóa
                  </li>
                </ul>
              </div>
            </div>

            <div className="schedule-modal-footer">
              <button
                className="schedule-btn-cancel"
                onClick={handleCancelEdit}
              >
                Hủy
              </button>
              <button className="schedule-btn-save" onClick={handleSaveEdit}>
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
