import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Sidebar from "../../components/common/Sidebar/Sidebar";
import Header from "../../components/common/Header/header";
import Location from "./Location";
import Notifications from "./Notifications";
import ScheduleService from "../../services/schedule.service";
import "./Dashboard.css";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function ParentDashboard() {
  const [activePage, setActivePage] = useState("Trang chủ");
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Menu items for parent
  const parentMenuItems = [
    { icon: "/icons/home.png", label: "Trang chủ" },
    { icon: "/icons/route.png", label: "Vị trí" },
    { icon: "/icons/message.png", label: "Thông báo" },
  ];

  // Fetch kids trip data from backend
  useEffect(() => {
    const fetchKidsTrips = async () => {
      try {
        setLoading(true);
        const response = await ScheduleService.getMyKidsTrips();
        setKids(response || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching kids trips:", err);
        setError("Không thể tải thông tin chuyến đi");
        setKids([]);
      } finally {
        setLoading(false);
      }
    };

    fetchKidsTrips();
  }, []);

  // Get user info from sessionStorage
  const userInfo = JSON.parse(sessionStorage.getItem("user") || "{}");
  const userData = {
    name: userInfo.ho_ten || "Phụ huynh",
    greeting: `Chào mừng trở lại, ${userInfo.ho_ten || "phụ huynh"}!`,
    subtitle: "Đây là những tin chuyến đi hôm nay của con em",
    childName: kids.length > 0 ? kids[0].ten_con : "con em",
  };

  // Status label mapping
  const getStatusLabel = (status) => {
    const statusMap = {
      chuabatdau: "Chưa khởi hành",
      dangchay: "Đang chạy",
      hoanthanh: "Hoàn thành",
      huy: "Hủy",
    };
    return statusMap[status] || "Không xác định";
  };

  // Get student status badge color
  const getStudentStatusColor = (status) => {
    const colorMap = {
      daxuong: "#10b981", // green
      choxacnhan: "#f59e0b", // amber
      vangmat: "#ef4444", // red
      dihoc: "#3b82f6", // blue
    };
    return colorMap[status] || "#6b7280";
  };

  // Transform API data to trip format
  const trips = kids.flatMap((kid) =>
    (kid.danh_sach_chuyen || []).map((trip, idx) => ({
      id: `${kid.student_id}-${trip.schedule_id}-${idx}`,
      studentId: kid.student_id,
      scheduleId: trip.schedule_id,
      title: trip.loai_chuyen.includes("Đón") ? "Buổi Sáng" : "Buổi Chiều",
      shift: trip.loai_chuyen.includes("Đón") ? "morning" : "afternoon",
      shiftLabel: `${trip.ten_tuyen} - ${trip.loai_chuyen}`,
      time: trip.gio_du_kien.substring(0, 5),
      timeLabel: trip.loai_chuyen.includes("Đón")
        ? "Thời gian đón dự kiến:"
        : "Thời gian trả dự kiến:",
      pickupLocation: trip.diem_dung,
      status: getStatusLabel(trip.trang_thai_chuyen),
      studentStatus: trip.trang_thai_con,
      driver: trip.tai_xe,
      driverPhone: trip.sdt_tai_xe,
      busPlate: trip.bien_so_xe,
      distance: trip.khoang_cach,
    }))
  );

  // Route coordinates for the map (default)
  const routeCoordinates = [
    [21.0285, 105.8542],
    [21.0375, 105.8342],
    [21.0465, 105.8242],
    [21.0555, 105.8142],
    [21.0645, 105.8042],
    [21.0735, 105.7942],
    [21.0825, 105.7842],
  ];

  const renderContent = () => {
    switch (activePage) {
      case "Trang chủ":
        return (
          <div className="parent-dashboard-home">
            {/* <Header title="Trang chủ" showSearch={false} /> */}
            <div className="parent-dashboard-home-content">
              <div className="parent-dashboard-greeting">
                <div className="parent-dashboard-user-card">
                  <div className="parent-dashboard-avatar">
                    <img src="/image/avatar2.png" alt="User" />
                  </div>
                  <div className="parent-dashboard-user-text">
                    <h2>{userData.greeting}</h2>
                    <p>{userData.subtitle}</p>
                    {kids.length > 0 && (
                      <a href="#" className="parent-dashboard-child-link">
                        của con {kids[0].ten_con}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="parent-dashboard-grid">
                <div className="parent-dashboard-trips">
                  {loading && (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#999",
                      }}
                    >
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  )}

                  {error && (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#ef4444",
                      }}
                    >
                      <p>{error}</p>
                    </div>
                  )}

                  {!loading && trips.length === 0 && (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#999",
                      }}
                    >
                      <p>Hôm nay không có chuyến đi nào</p>
                    </div>
                  )}

                  <div className="parent-dashboard-trips-list">
                    {!loading &&
                      trips.map((trip) => (
                        <div
                          key={trip.id}
                          className={`parent-dashboard-trip-card ${trip.shift}`}
                        >
                          <div className="parent-dashboard-trip-header">
                            <div className="parent-dashboard-trip-icon">
                              {trip.shift === "morning" ? (
                                <svg
                                  width="32"
                                  height="32"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="4"
                                    fill="currentColor"
                                  />
                                  <path
                                    d="M12 2v4M12 18v4M22 12h-4M6 12H2"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  width="32"
                                  height="32"
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
                            <div className="parent-dashboard-trip-info">
                              <h4>{trip.title}</h4>
                              <p className="parent-dashboard-shift-label">
                                {trip.shiftLabel}
                              </p>
                            </div>
                          </div>

                          <div className="parent-dashboard-trip-details">
                            <div className="parent-dashboard-detail-row">
                              <span className="parent-dashboard-label">
                                Trạng thái chuyến:
                              </span>
                              <span className="parent-dashboard-status-text">
                                {trip.status}
                              </span>
                            </div>
                            <div className="parent-dashboard-detail-row">
                              <span className="parent-dashboard-label">
                                {trip.timeLabel}
                              </span>
                              <span className="parent-dashboard-time">
                                {trip.time}
                              </span>
                            </div>
                            <div className="parent-dashboard-detail-row">
                              <span className="parent-dashboard-label">
                                Điểm đón/trả:
                              </span>
                              <span className="parent-dashboard-pickup">
                                {trip.pickupLocation}
                              </span>
                            </div>
                            <div className="parent-dashboard-detail-row">
                              <span className="parent-dashboard-label">
                                Trạng thái con:
                              </span>
                              <span
                                style={{
                                  color: getStudentStatusColor(
                                    trip.studentStatus
                                  ),
                                  fontWeight: "bold",
                                }}
                              >
                                {trip.studentStatus === "daxuong"
                                  ? "Đã xuống"
                                  : trip.studentStatus === "choxacnhan"
                                  ? "Chờ xác nhận"
                                  : trip.studentStatus === "vangmat"
                                  ? "Vắng mặt"
                                  : trip.studentStatus === "dihoc"
                                  ? "Đi học"
                                  : "Không xác định"}
                              </span>
                            </div>
                            <div className="parent-dashboard-detail-row">
                              <span className="parent-dashboard-label">
                                Tài xế:
                              </span>
                              <span className="parent-dashboard-pickup">
                                {trip.driver} ({trip.driverPhone})
                              </span>
                            </div>
                            <div className="parent-dashboard-detail-row">
                              <span className="parent-dashboard-label">
                                Xe số:
                              </span>
                              <span className="parent-dashboard-pickup">
                                {trip.busPlate}
                              </span>
                            </div>
                          </div>

                          <button
                            className="parent-dashboard-action-btn"
                            onClick={() => setActivePage("Vị trí")}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              style={{ marginRight: "8px" }}
                            >
                              <path
                                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                                fill="currentColor"
                              />
                            </svg>
                            Xem vị trí
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="parent-dashboard-map-section">
                  <div className="parent-dashboard-map-container">
                    <MapContainer
                      center={[21.0555, 105.8142]}
                      zoom={12}
                      style={{
                        height: "100%",
                        width: "100%",
                        borderRadius: "12px",
                      }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <Polyline
                        positions={routeCoordinates}
                        color="#3b82f6"
                        weight={4}
                        opacity={0.8}
                      />
                      <Marker position={routeCoordinates[0]}>
                        <Popup>Điểm bắt đầu</Popup>
                      </Marker>
                      <Marker
                        position={routeCoordinates[routeCoordinates.length - 1]}
                      >
                        <Popup>Trường Vinschool</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Vị trí":
        return <Location />;

      case "Thông báo":
        return <Notifications />;

      default:
        return null;
    }
  };

  return (
    <div className="parent-dashboard-app">
      <Sidebar
        active={activePage}
        onSelect={setActivePage}
        menuItems={parentMenuItems}
      />
      <div className="parent-dashboard-main">
        <Header title="Phụ huynh" showSearch={false} />
        <div className="parent-dashboard-content">{renderContent()}</div>
      </div>
    </div>
  );
}

export default ParentDashboard;
