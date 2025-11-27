import React, { useState, useEffect } from "react";
import Header from "../../components/common/Header/header";
import "./Schedule.css";
import RouteService from "../../services/route.service";
import DriverService from "../../services/driver.service";
import BusService from "../../services/bus.service";
import ScheduleService from "../../services/schedule.service";

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
  const [selectedDate, setSelectedDate] = useState(today.getDate()); // Auto-select today's date
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAssignmentHistory();
    }
  }, [selectedDate, activeShiftFilter]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [schedulesData, routesData, driversData, busesData] =
        await Promise.all([
          ScheduleService.getAllSchedules(),
          RouteService.getAllRoutes(),
          DriverService.getAllDrivers(),
          BusService.getAllBuses(),
        ]);
      setSchedules(schedulesData);
      setRoutes(routesData);
      setDrivers(driversData);
      setBuses(busesData);
    } catch (error) {
      console.error("Error loading schedule data:", error);
      alert(
        "Không thể tải dữ liệu lịch trình. Vui lòng kiểm tra kết nối backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentHistory = async () => {
    try {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(selectedDate).padStart(2, "0")}`;

      const filters = {
        date: dateStr,
        type: activeShiftFilter === "di" ? "luot_di" : "luot_ve",
      };

      const history = await ScheduleService.getAssignmentHistory(filters);
      setAssignmentHistory(history);
    } catch (error) {
      console.error("Error loading assignment history:", error);
      setAssignmentHistory([]);
    }
  };

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

  // Format time string (HH:MM:SS) to display (HH:MM)
  const formatTimeString = (timeString) => {
    if (!timeString) return "--:--";
    // timeString format: "06:00:00"
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
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
    if (!selectedDate || !assignmentHistory) return [];

    // Backend already filters by date and shift type, just return sorted
    return assignmentHistory;
  };

  // Get available routes for selected date (filter out fully booked routes)
  const getAvailableRoutes = () => {
    if (!routes || routes.length === 0) return [];

    // Filter routes by selected shift (loai_tuyen)
    const shiftType = newSchedule.shift === "di" ? "luot_di" : "luot_ve";

    const filteredRoutes = routes.filter((route) => {
      // Only show routes matching the selected shift
      if (route.loai_tuyen !== shiftType) return false;

      // Check if this route is already scheduled for this date and shift
      const existingSchedule = schedules.find(
        (s) =>
          s.route_id === parseInt(route.id) &&
          s.createDate === newSchedule.ngay_chay &&
          s.loai_tuyen === shiftType
      );

      // Show route if not already scheduled
      return !existingSchedule;
    });

    return filteredRoutes.map((route) => ({
      ...route,
      name: route.routeName, // Add name property for display
    }));
  };

  // Get schedules for selected date only
  const getSchedulesForDate = () => {
    if (!selectedDate) return schedules;

    const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(selectedDate).padStart(2, "0")}`;
    return schedules.filter((s) => s.createDate === selectedDateStr);
  };

  // Check if driver is already assigned to a shift on the selected date
  const isDriverAssigned = (driverCode) => {
    if (!driverCode || !newSchedule.ngay_chay || !newSchedule.shift)
      return false;

    const shiftType = newSchedule.shift === "di" ? "luot_di" : "luot_ve";

    // Find the driver to get the actual driver_code number
    const driver = drivers.find((d) => d.code === driverCode);
    if (!driver) return false;

    return schedules.some(
      (s) =>
        s.driver_id === driver.driver_code &&
        s.createDate === newSchedule.ngay_chay &&
        s.loai_tuyen === shiftType
    );
  };

  // Check if bus is already assigned to a shift on the selected date
  const isBusAssigned = (busId) => {
    if (!busId || !newSchedule.ngay_chay || !newSchedule.shift) return false;

    const shiftType = newSchedule.shift === "di" ? "luot_di" : "luot_ve";

    return schedules.some(
      (s) =>
        s.bus_id === parseInt(busId) &&
        s.createDate === newSchedule.ngay_chay &&
        s.loai_tuyen === shiftType
    );
  };

  // Check if driver is already assigned (for edit mode)
  const isDriverAssignedForEdit = (driverCode) => {
    if (!driverCode || !editSchedule.ngay_chay || !editSchedule.shift)
      return false;

    const shiftType = editSchedule.shift === "di" ? "luot_di" : "luot_ve";

    // Find the driver to get the actual driver_code number
    const driver = drivers.find((d) => d.code === driverCode);
    if (!driver) return false;

    return schedules.some(
      (s) =>
        s.id !== editSchedule.id && // Exclude current schedule
        s.driver_id === driver.driver_code &&
        s.createDate === editSchedule.ngay_chay &&
        s.loai_tuyen === shiftType // Only check SAME shift
    );
  };

  // Check if bus is already assigned (for edit mode)
  const isBusAssignedForEdit = (busId) => {
    if (!busId || !editSchedule.ngay_chay || !editSchedule.shift) return false;

    const shiftType = editSchedule.shift === "di" ? "luot_di" : "luot_ve";

    return schedules.some(
      (s) =>
        s.id !== editSchedule.id && // Exclude current schedule
        s.bus_id === parseInt(busId) &&
        s.createDate === editSchedule.ngay_chay &&
        s.loai_tuyen === shiftType
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

  // Handle route change - do NOT auto-change shift
  const handleRouteChange = (routeId) => {
    setNewSchedule({
      ...newSchedule,
      route_id: routeId,
      driver_id: "", // Reset driver
      bus_id: "", // Reset bus
    });
  };

  // Handle shift change - reset route, driver, bus
  const handleShiftChange = (shift) => {
    setNewSchedule({
      ...newSchedule,
      shift: shift,
      route_id: "", // Reset route when shift changes
      driver_id: "", // Reset driver
      bus_id: "", // Reset bus
    });
  };

  const handleSaveSchedule = async () => {
    // Validation - only route, date, and shift are required
    if (!newSchedule.route_id || !newSchedule.ngay_chay || !newSchedule.shift) {
      alert(
        "Vui lòng điền đầy đủ thông tin bắt buộc (Tuyến đường, Ngày chạy, Chuyến)!"
      );
      return;
    }

    try {
      // Find route với loai_tuyen matching shift
      const selectedRoute = routes.find(
        (r) =>
          parseInt(r.id) === parseInt(newSchedule.route_id) &&
          r.loai_tuyen === (newSchedule.shift === "di" ? "luot_di" : "luot_ve")
      );

      if (!selectedRoute) {
        console.log("Debug - newSchedule.route_id:", newSchedule.route_id);
        console.log("Debug - newSchedule.shift:", newSchedule.shift);
        console.log("Debug - routes:", routes);
        alert("Không tìm thấy tuyến đường phù hợp với chuyến đã chọn!");
        return;
      }

      // Map driver_code to actual user ID
      let actualDriverId = null;
      if (newSchedule.driver_id) {
        const driver = drivers.find((d) => d.code === newSchedule.driver_id);
        if (!driver) {
          alert("Không tìm thấy tài xế!");
          return;
        }
        // Find user ID from driver_code
        actualDriverId = driver.id; // This should be the user.id, not driver_code
      }

      // Prepare payload for backend
      const payload = {
        route_id: parseInt(selectedRoute.id),
        driver_id: actualDriverId ? parseInt(actualDriverId) : null,
        bus_id: newSchedule.bus_id ? parseInt(newSchedule.bus_id) : null,
        ngay_chay: newSchedule.ngay_chay,
        gio_bat_dau: "06:00:00", // Default start time
      };

      console.log("Creating schedule with payload:", payload);

      // Call backend API
      await ScheduleService.createSchedule(payload);

      // Reload data
      await loadAllData();
      if (selectedDate) {
        await loadAssignmentHistory();
      }

      setShowAddModal(false);
      alert("Thêm lịch trình thành công!");
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert(
        error.message ||
          "Không thể tạo lịch trình. Vui lòng kiểm tra lại thông tin!"
      );
    }
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

  const handleDeleteSchedule = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch trình này?")) {
      try {
        await ScheduleService.deleteSchedule(id);
        await loadAllData();
        if (selectedDate) {
          await loadAssignmentHistory();
        }
        alert("Đã xóa lịch trình!");
      } catch (error) {
        console.error("Error deleting schedule:", error);
        alert("Không thể xóa lịch trình. Vui lòng thử lại!");
      }
    }
  };

  const handleStatusClick = (id, status) => {
    const schedule = schedules.find((s) => s.id === id);
    if (!schedule) return;

    // Map driver_id (driver_code number) to driver.code (padded string)
    let driverCodeString = "";
    if (schedule.driver_id) {
      const driver = drivers.find((d) => d.driver_code === schedule.driver_id);
      if (driver) {
        driverCodeString = driver.code;
      }
    }

    setEditSchedule({
      id: schedule.id,
      route_id: schedule.route_id,
      route: schedule.route,
      street: schedule.street,
      driver_id: driverCodeString,
      bus_id: schedule.bus_id || "",
      ngay_chay: schedule.createDate, // Use createDate from API response
      shift: schedule.shift === "Lượt đi" ? "di" : "ve",
      createDate: schedule.createDate,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      // Map driver_code to actual user ID
      let actualDriverId = null;
      if (editSchedule.driver_id) {
        const driver = drivers.find((d) => d.code === editSchedule.driver_id);
        if (!driver) {
          alert("Không tìm thấy tài xế!");
          return;
        }
        actualDriverId = driver.id;
      }

      // Prepare payload
      const payload = {
        route_id: parseInt(editSchedule.route_id.toString().replace(/^0+/, "")),
        driver_id: actualDriverId ? parseInt(actualDriverId) : null,
        bus_id: editSchedule.bus_id ? parseInt(editSchedule.bus_id) : null,
        ngay_chay: editSchedule.ngay_chay,
        gio_bat_dau: editSchedule.start || "06:00:00",
      };

      console.log("Updating schedule with payload:", payload);

      // Call backend API
      await ScheduleService.updateSchedule(editSchedule.id, payload);

      // Reload data
      await loadAllData();
      if (selectedDate) {
        await loadAssignmentHistory();
      }

      setShowEditModal(false);
      alert("Cập nhật lịch trình thành công!");
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert(
        error.message ||
          "Không thể cập nhật lịch trình. Vui lòng kiểm tra lại thông tin!"
      );
    }
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
                        <span className="route-label">{item.ten_tuyen}</span>
                        <span className="time">
                          {formatHistoryTime(item.ngay)}
                        </span>
                        <span className="status">{item.noidung}</span>
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
                      {formatTimeString(item.start)}
                    </div>
                    <div className="col col-status">
                      <button
                        className={`status-btn ${
                          !item.driver_id || !item.bus_id
                            ? "pending"
                            : "assigned"
                        }`}
                        onClick={() =>
                          handleStatusClick(item.id, item.trang_thai)
                        }
                      >
                        {!item.driver_id || !item.bus_id
                          ? "Phân công"
                          : "Thay đổi"}
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
                  {getAvailableRoutes().map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
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
                  {drivers.map((driver) => (
                    <option
                      key={driver.code}
                      value={driver.code}
                      disabled={isDriverAssigned(driver.code)}
                    >
                      {driver.fullname} - {driver.phone}{" "}
                      {isDriverAssigned(driver.code) ? "(Đã phân công)" : ""}
                    </option>
                  ))}
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
                  {buses
                    .filter((bus) => bus.status !== "Bảo trì") // Exclude maintenance buses
                    .sort((a, b) => {
                      // Available buses first (status "Ngừng" and not assigned)
                      const aAvailable =
                        a.status === "Ngừng" && !isBusAssigned(a.id);
                      const bAvailable =
                        b.status === "Ngừng" && !isBusAssigned(b.id);
                      if (aAvailable && !bAvailable) return -1;
                      if (!aAvailable && bAvailable) return 1;
                      return 0;
                    })
                    .map((bus) => {
                      const isAvailable =
                        bus.status === "Ngừng" && !isBusAssigned(bus.id);
                      const statusText =
                        bus.status === "Đang hoạt động"
                          ? "(Đang chạy tuyến)"
                          : bus.status === "Ngừng" && isBusAssigned(bus.id)
                          ? "(Đã phân công)"
                          : bus.status === "Bảo trì"
                          ? "(Bảo trì)"
                          : "";

                      return (
                        <option
                          key={bus.id}
                          value={bus.id}
                          disabled={!isAvailable}
                        >
                          {bus.licensePlate} - {bus.manufacturer} ({bus.seats}{" "}
                          chỗ) {statusText}
                        </option>
                      );
                    })}
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
                  value={
                    editSchedule.shift === "luot_di" ? "Lượt đi" : "Lượt về"
                  }
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
                  {drivers.map((driver) => (
                    <option
                      key={driver.code}
                      value={driver.code}
                      disabled={isDriverAssignedForEdit(driver.code)}
                    >
                      {driver.fullname} - {driver.phone}{" "}
                      {isDriverAssignedForEdit(driver.code)
                        ? "(Đã phân công)"
                        : ""}
                    </option>
                  ))}
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
                  {buses
                    .filter((bus) => bus.status !== "bảo trì") // Exclude maintenance buses
                    .sort((a, b) => {
                      // Keep currently selected bus at top
                      if (a.id === parseInt(editSchedule.bus_id)) return -1;
                      if (b.id === parseInt(editSchedule.bus_id)) return 1;

                      // Available buses first (status "Ngừng" and not assigned)
                      const aAvailable =
                        a.status === "Ngừng" && !isBusAssignedForEdit(a.id);
                      const bAvailable =
                        b.status === "Ngừng" && !isBusAssignedForEdit(b.id);
                      if (aAvailable && !bAvailable) return -1;
                      if (!aAvailable && bAvailable) return 1;
                      return 0;
                    })
                    .map((bus) => {
                      const isAvailable =
                        bus.status === "Ngừng" && !isBusAssignedForEdit(bus.id);
                      const isCurrentlySelected =
                        bus.id === parseInt(editSchedule.bus_id);
                      const statusText =
                        bus.status === "Đang hoạt động"
                          ? "(Đang chạy tuyến)"
                          : bus.status === "Ngừng" &&
                            isBusAssignedForEdit(bus.id)
                          ? "(Đã phân công)"
                          : bus.status === "Bảo trì"
                          ? "(Bảo trì)"
                          : "";

                      return (
                        <option
                          key={bus.id}
                          value={bus.id}
                          disabled={!isAvailable && !isCurrentlySelected}
                        >
                          {bus.licensePlate} - {bus.manufacturer} ({bus.seats}{" "}
                          chỗ) {statusText}
                        </option>
                      );
                    })}
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
