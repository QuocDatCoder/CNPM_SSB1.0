import React, { useState } from "react";
import Header from "../../components/common/Header/header";
import "./Schedule.css";

const scheduleData = [
  {
    id: 1,
    route: "Tuyến số 1",
    street: "Đường An Dương Vương",
    createDate: "11/10/2025",
    shift: "Lượt đi",
    time: "6:00",
    status: "Phân công",
  },
  {
    id: 2,
    route: "Tuyến số 2",
    street: "Đường Lê Lợi",
    createDate: "11/10/2025",
    shift: "Lượt về",
    time: "8:00",
    status: "Thay đổi",
  },
  {
    id: 3,
    route: "Tuyến số 3",
    street: "Đường Trường Chinh",
    createDate: "12/10/2025",
    shift: "Lượt đi",
    time: "7:00",
    status: "Phân công",
  },
  {
    id: 4,
    route: "Tuyến số 1",
    street: "Đường An Dương Vương",
    createDate: "12/10/2025",
    shift: "Lượt về",
    time: "9:00",
    status: "Thay đổi",
  },
];

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

  const handleAddSchedule = () => {
    console.log("Add schedule");
  };

  const handleDeleteSchedule = (id) => {
    console.log("Delete schedule:", id);
  };

  const handleStatusClick = (id, status) => {
    console.log("Status clicked:", id, status);
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
                  <button className="filter-btn active">Lượt đi</button>
                  <button className="filter-btn">Lượt về</button>
                  <span className="date-display">11/10</span>
                </div>
              </div>

              <div className="assignment-list">
                {[1, 1, 1].map((_, idx) => (
                  <div key={idx} className="assignment-item">
                    <div className="assignment-info">
                      <span className="route-label">Tuyến số 1</span>
                      <span className="time">09:00 10/10</span>
                      <span className="status">Thêm</span>
                    </div>
                  </div>
                ))}
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
                {scheduleData.map((item, index) => (
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
                    <div className="col col-time">{item.time}</div>
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
                        onClick={() => item.id}
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
    </div>
  );
}
