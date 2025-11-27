import React, { useState } from "react";
import "./Assignments.css";

export default function Assignments() {
  const [viewMode, setViewMode] = useState("day"); // "day" or "week"
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 20)); // Thứ 2, 20/10/2025

  // Sample schedule data
  const scheduleData = {
    "2025-10-20": [
      {
        id: 1,
        type: "morning",
        title: "Chuyến đi sáng",
        time: "06:00",
        route: "Số xe: 29B-12345",
        startLocation: "KĐT Times City",
        endLocation: "Trường Vinschool",
      },
      {
        id: 2,
        type: "afternoon",
        title: "Chuyến về chiều",
        time: "16:00",
        route: "Số xe: 29B-12345",
        startLocation: "Trường Vinschool",
        endLocation: "KĐT Times City",
      },
    ],
    "2025-10-21": [
      {
        id: 3,
        type: "morning",
        title: "Chuyến đi sáng",
        time: "06:00",
        route: "Số xe: 29B-12345",
        startLocation: "KĐT Times City",
        endLocation: "Trường Vinschool",
      },
      {
        id: 4,
        type: "afternoon",
        title: "Chuyến về chiều",
        time: "16:00",
        route: "Số xe: 29B-12345",
        startLocation: "Trường Vinschool",
        endLocation: "KĐT Times City",
      },
    ],
    "2025-10-22": [
      {
        id: 5,
        type: "morning",
        title: "Chuyến đi sáng",
        time: "06:15",
        route: "Số xe: 29H-67890",
        startLocation: "KĐT Royal City",
        endLocation: "Trường Vinschool",
      },
      {
        id: 6,
        type: "afternoon",
        title: "Chuyến về chiều",
        time: "16:00",
        route: "Số xe: 29B-12345",
        startLocation: "Trường Vinschool",
        endLocation: "KĐT Times City",
      },
    ],
    "2025-10-23": [], // Không có chuyến đi
    "2025-10-24": [
      {
        id: 7,
        type: "morning",
        title: "Chuyến đi sáng",
        time: "06:00",
        route: "Số xe: 29B-12345",
        startLocation: "KĐT Times City",
        endLocation: "Trường Vinschool",
      },
      {
        id: 8,
        type: "afternoon",
        title: "Chuyến về chiều",
        time: "16:00",
        route: "Số xe: 29B-12345",
        startLocation: "Trường Vinschool",
        endLocation: "KĐT Times City",
      },
    ],
  };

  const getWeekDates = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Thứ 2 đầu tuần
    const monday = new Date(date.setDate(diff));
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDates = getWeekDates(new Date(currentDate));
  const weekNumber = 43;

  const formatDate = (date) => {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const getDayName = (date) => {
    const days = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    return days[date.getDay()];
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const prevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const currentDateKey = formatDateKey(currentDate);
  const todaySchedule = scheduleData[currentDateKey] || [];

  return (
    <div className="assignments-page">
      <div className="assignments-content">
        {/* <div className="assignments-header-section">
          <h1 className="assignments-title">Lịch trình của bạn</h1>
          <p className="assignments-subtitle">
            Hệ thống theo dõi xe buýt trường học thông minh
          </p>
        </div> */}

        <div className="assignments-content">
          <div className="view-toggle-section">
            <div className="date-navigation">
              <button
                className="nav-arrow-btn"
                onClick={viewMode === "day" ? prevDay : prevWeek}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                </svg>
              </button>
              <div className="current-period">
                {viewMode === "day"
                  ? `${getDayName(currentDate)}, ${formatDate(
                      currentDate
                    )}/2025`
                  : `Tuần ${weekNumber} (${formatDate(weekDates[0])}/10)`}
              </div>
              <button
                className="nav-arrow-btn"
                onClick={viewMode === "day" ? nextDay : nextWeek}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                </svg>
              </button>
            </div>

            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === "day" ? "active" : ""}`}
                onClick={() => setViewMode("day")}
              >
                Theo ngày
              </button>
              <button
                className={`toggle-btn ${viewMode === "week" ? "active" : ""}`}
                onClick={() => setViewMode("week")}
              >
                Theo tuần
              </button>
            </div>
          </div>

          {viewMode === "day" ? (
            <div className="day-view">
              {todaySchedule.length === 0 ? (
                <div className="no-schedule">Không có chuyến đi</div>
              ) : (
                todaySchedule.map((trip) => (
                  <div key={trip.id} className={`trip-card ${trip.type}`}>
                    <div className="trip-header">
                      <div className="trip-icon">
                        {trip.type === "morning" ? (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle cx="12" cy="12" r="4" fill="currentColor" />
                            <path
                              d="M12 2v4M12 18v4M22 12h-4M6 12H2"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                        ) : (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                              fill="currentColor"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="trip-title-section">
                        <h3 className="trip-title">{trip.title}</h3>
                        <p className="trip-time">{trip.time}</p>
                      </div>
                      <button className="trip-action-btn">
                        {trip.type === "morning" ? "Bắt đầu" : "Chưa đến giờ"}
                      </button>
                    </div>

                    <div className="trip-details">
                      <div className="trip-route-info">
                        <div className="route-info-icon">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="14"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M7 8h10M7 12h6"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                        <span>{trip.route}</span>
                      </div>

                      <div className="trip-locations">
                        <div className="location-item start">
                          <div className="location-marker">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <circle cx="8" cy="8" r="6" />
                            </svg>
                          </div>
                          <div className="location-info">
                            <span className="location-label">Điểm đầu</span>
                            <span className="location-name">
                              {trip.startLocation}
                            </span>
                          </div>
                        </div>

                        <div className="location-item end">
                          <div className="location-marker">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <path d="M8 0l2.5 5 5.5.5-4 4 1 5.5L8 12l-5 3 1-5.5-4-4 5.5-.5L8 0z" />
                            </svg>
                          </div>
                          <div className="location-info">
                            <span className="location-label">Điểm đến</span>
                            <span className="location-name">
                              {trip.endLocation}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="week-view">
              {weekDates.map((date, index) => {
                const dateKey = formatDateKey(date);
                const daySchedule = scheduleData[dateKey] || [];
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <div
                    key={index}
                    className={`week-day-card ${isWeekend ? "weekend" : ""}`}
                  >
                    <div className="week-day-header">
                      <span className="day-name">
                        {getDayName(date).replace("Thứ ", "Thứ ")}
                      </span>
                      <span className="day-date">{formatDate(date)}</span>
                    </div>

                    <div className="week-day-content">
                      {daySchedule.length === 0 ? (
                        <div className="no-trips">
                          {isWeekend ? "Ngày nghỉ" : "Không có chuyến đi"}
                        </div>
                      ) : (
                        daySchedule.map((trip) => (
                          <div
                            key={trip.id}
                            className={`week-trip ${trip.type}`}
                          >
                            <div className="week-trip-icon">
                              {trip.type === "morning" ? "☀️" : "🌙"}
                            </div>
                            <div className="week-trip-info">
                              <p className="week-trip-title">{trip.title}</p>
                              <p className="week-trip-time">{trip.time}</p>
                              <p className="week-trip-route">{trip.route}</p>
                              <div className="week-trip-locations">
                                <div className="week-location">
                                  <span className="location-dot start-dot"></span>
                                  <span>{trip.startLocation}</span>
                                </div>
                                <div className="week-location">
                                  <span className="location-dot end-dot"></span>
                                  <span>{trip.endLocation}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
