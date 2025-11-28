import React, { useState, useEffect } from "react";
import "./Assignments.css";
import ScheduleService from "../../services/schedule.service";
import useDriverScheduleSocket from "../../hooks/useDriverScheduleSocket";

export default function Assignments() {
  const [viewMode, setViewMode] = useState("day"); // "day" or "week"
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  // Helper function to normalize date to YYYY-MM-DD format
  const normalizeDate = (date) => {
    if (typeof date === "string") {
      return date.split("T")[0]; // Handle ISO datetime
    }
    if (date instanceof Date) {
      return date.toISOString().split("T")[0];
    }
    return date; // Assume already formatted
  };

  // Fetch schedule from backend on mount and when date changes
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const response = await ScheduleService.getMySchedule();
        setScheduleData(response);
        setError(null);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError("Không thể tải lịch trình");
        setScheduleData({});
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // WebSocket hook để nhận real-time schedule updates
  useDriverScheduleSocket(
    user.id,
    (data) => {
      // Khi có lịch mới được phân công: cập nhật real-time không cần reload
      console.log("📢 New schedule assigned:", data);
      console.log("📢 data.data:", data.data);
      setScheduleData((prevData) => {
        const newData = { ...prevData };
        const schedule = data.data;
        const dateKey = normalizeDate(schedule.date);

        console.log("📢 dateKey:", dateKey);
        console.log("📢 schedule:", schedule);

        if (!newData[dateKey]) {
          newData[dateKey] = [];
        }

        // Chuẩn hóa data để match với format hiện tại
        const normalizedSchedule = {
          id: schedule.id,
          type: schedule.type === "luot_di" ? "morning" : "afternoon",
          title:
            schedule.title ||
            (schedule.type === "luot_di" ? "Lượt đi" : "Lượt về"),
          time: schedule.time?.substring(0, 5) || schedule.time,
          route: schedule.route || "",
          startLocation: schedule.startLocation || "",
          endLocation: schedule.endLocation || "",
          status: schedule.status || "chuabatdau",
        };

        console.log("📢 normalizedSchedule:", normalizedSchedule);

        // Thêm lịch mới vào danh sách
        newData[dateKey] = [...newData[dateKey], normalizedSchedule];

        console.log("📢 Updated scheduleData:", newData);

        return newData;
      });
    },
    (data) => {
      // Khi cập nhật lịch: cập nhật real-time không cần reload
      console.log("📝 Schedule updated:", data);
      console.log("📝 data.data:", data.data);

      // Nếu không có data, refetch để đảm bảo UI cập nhật
      if (!data.data) {
        console.log("📝 No data received, refetching...");
        ScheduleService.getMySchedule()
          .then((response) => {
            console.log("📝 Refetched schedule data:", response);
            setScheduleData(response);
          })
          .catch((err) => {
            console.error("❌ Error refetching schedule:", err);
          });
        return;
      }

      // Update state từ socket data
      setScheduleData((prevData) => {
        const newData = { ...prevData };
        const updatedSchedule = data.data;
        const dateKey = normalizeDate(updatedSchedule.date);

        console.log("📝 dateKey:", dateKey);
        console.log("📝 Updating schedule with id:", updatedSchedule.id);

        // Chuẩn hóa data
        const normalizedSchedule = {
          id: updatedSchedule.id,
          type: updatedSchedule.type === "luot_di" ? "morning" : "afternoon",
          title:
            updatedSchedule.title ||
            (updatedSchedule.type === "luot_di" ? "Lượt đi" : "Lượt về"),
          time: updatedSchedule.time?.substring(0, 5) || updatedSchedule.time,
          route: updatedSchedule.route || "",
          startLocation: updatedSchedule.startLocation || "",
          endLocation: updatedSchedule.endLocation || "",
          status: updatedSchedule.status || "chuabatdau",
        };

        // Tìm và xóa lịch từ tất cả các ngày (nếu ngày chạy thay đổi)
        Object.keys(newData).forEach((key) => {
          newData[key] = newData[key].filter(
            (s) => s.id !== updatedSchedule.id
          );
        });

        // Tạo ngày mới nếu chưa có
        if (!newData[dateKey]) {
          newData[dateKey] = [];
        }

        // Thêm lịch cập nhật vào ngày mới
        newData[dateKey] = [...newData[dateKey], normalizedSchedule];

        console.log("📝 Updated scheduleData:", newData);

        return newData;
      });
    },
    (data) => {
      // Khi xóa lịch: cập nhật real-time không cần reload
      console.log("🗑️ Schedule deleted:", data);
      console.log("🗑️ scheduleId:", data.scheduleId);

      // Cập nhật state real-time - xóa lịch khỏi tất cả các ngày
      setScheduleData((prevData) => {
        const newData = { ...prevData };
        const scheduleId = data.scheduleId;

        Object.keys(newData).forEach((dateKey) => {
          newData[dateKey] = newData[dateKey].filter(
            (schedule) => schedule.id !== scheduleId
          );
        });

        console.log("🗑️ Updated scheduleData after deletion:", newData);
        return newData;
      });
    }
  );

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
              {loading ? (
                <div className="no-schedule">Đang tải lịch trình...</div>
              ) : error ? (
                <div className="no-schedule" style={{ color: "red" }}>
                  {error}
                </div>
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
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  Đang tải lịch trình...
                </div>
              ) : error ? (
                <div
                  style={{ textAlign: "center", padding: "40px", color: "red" }}
                >
                  {error}
                </div>
              ) : (
                <>
                  {weekDates.map((date, index) => {
                    const dateKey = formatDateKey(date);
                    let daySchedule = scheduleData[dateKey] || [];
                    const isWeekend = date.getDay() === 0; // Chỉ Chủ nhật là ngày nghỉ

                    // Sort trips: morning (lượt đi) trước, afternoon (lượt về) sau
                    daySchedule = daySchedule.sort((a, b) => {
                      if (a.type === "morning" && b.type === "afternoon")
                        return -1;
                      if (a.type === "afternoon" && b.type === "morning")
                        return 1;
                      return 0;
                    });

                    return (
                      <div
                        key={index}
                        className={`week-day-card ${
                          isWeekend ? "weekend" : ""
                        }`}
                      >
                        <div className="week-day-header">
                          <span className="day-name">
                            {getDayName(date).replace("Thứ ", "Thứ ")}
                          </span>
                          <span className="day-date">{formatDate(date)}</span>
                        </div>

                        <div className="week-day-content">
                          {isWeekend ? (
                            <div className="no-trips">Ngày nghỉ</div>
                          ) : (
                            <>
                              {/* Slot cho lượt đi (morning) */}
                              {(() => {
                                const morningTrip = daySchedule.find(
                                  (trip) => trip.type === "morning"
                                );
                                return morningTrip ? (
                                  <div
                                    key={morningTrip.id}
                                    className={`week-trip morning`}
                                  >
                                    <div className="week-trip-icon">☀️</div>
                                    <div className="week-trip-info">
                                      <p className="week-trip-title">
                                        {morningTrip.title}
                                      </p>
                                      <p className="week-trip-time">
                                        {morningTrip.time}
                                      </p>
                                      <p className="week-trip-route">
                                        {morningTrip.route}
                                      </p>
                                      <div className="week-trip-locations">
                                        <div className="week-location">
                                          <span className="location-dot start-dot"></span>
                                          <span>
                                            {morningTrip.startLocation}
                                          </span>
                                        </div>
                                        <div className="week-location">
                                          <span className="location-dot end-dot"></span>
                                          <span>{morningTrip.endLocation}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="week-trip-placeholder">
                                    <div className="week-trip-icon">☀️</div>
                                    <div className="week-trip-info">
                                      <p className="week-trip-title">
                                        Chưa có lịch lượt đi
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Slot cho lượt về (afternoon) */}
                              {(() => {
                                const afternoonTrip = daySchedule.find(
                                  (trip) => trip.type === "afternoon"
                                );
                                return afternoonTrip ? (
                                  <div
                                    key={afternoonTrip.id}
                                    className={`week-trip afternoon`}
                                  >
                                    <div className="week-trip-icon">🌙</div>
                                    <div className="week-trip-info">
                                      <p className="week-trip-title">
                                        {afternoonTrip.title}
                                      </p>
                                      <p className="week-trip-time">
                                        {afternoonTrip.time}
                                      </p>
                                      <p className="week-trip-route">
                                        {afternoonTrip.route}
                                      </p>
                                      <div className="week-trip-locations">
                                        <div className="week-location">
                                          <span className="location-dot start-dot"></span>
                                          <span>
                                            {afternoonTrip.startLocation}
                                          </span>
                                        </div>
                                        <div className="week-location">
                                          <span className="location-dot end-dot"></span>
                                          <span>
                                            {afternoonTrip.endLocation}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="week-trip-placeholder">
                                    <div className="week-trip-icon">🌙</div>
                                    <div className="week-trip-info">
                                      <p className="week-trip-title">
                                        Chưa có lịch lượt về
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
