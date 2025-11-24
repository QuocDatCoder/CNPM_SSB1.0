import React, { useState } from "react";
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

  // Menu items for parent
  const parentMenuItems = [
    { icon: "/icons/home.png", label: "Trang chủ" },
    { icon: "/icons/route.png", label: "Vị trí" },
    { icon: "/icons/message.png", label: "Thông báo" },
  ];

  // Sample data
  const userData = {
    name: "Nguyễn Văn A",
    greeting: "Chào mừng trở lại, anh A!",
    subtitle: "Đây là những tin chuyến đi hôm nay của bé",
    childName: "Nguyễn Văn B",
  };

  const trips = [
    {
      id: 1,
      title: "Buổi Sáng",
      shift: "morning",
      shiftLabel: "Tuyến 1 - Đón",
      time: "6:30",
      timeLabel: "Thời gian đón dự kiến:",
      pickupLocation: "An Dương Vương",
      status: "Chưa khởi hành",
    },
    {
      id: 2,
      title: "Buổi Chiều",
      shift: "afternoon",
      shiftLabel: "Tuyến 1 - Trả",
      time: "16:30",
      timeLabel: "Thời gian trả dự kiến:",
      pickupLocation: "An Dương Vương",
      status: "Chưa khởi hành",
    },
  ];

  // Route coordinates for the map
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
            <Header title="Trang chủ" showSearch={false} />
            <div className="parent-dashboard-home-content">
              <div className="parent-dashboard-greeting">
                <div className="parent-dashboard-user-card">
                  <div className="parent-dashboard-avatar">
                    <img src="/image/avata.png" alt="User" />
                  </div>
                  <div className="parent-dashboard-user-text">
                    <h2>{userData.greeting}</h2>
                    <p>{userData.subtitle}</p>
                    <a href="#" className="parent-dashboard-child-link">
                      của con {userData.childName}
                    </a>
                  </div>
                </div>
              </div>

              <div className="parent-dashboard-grid">
                <div className="parent-dashboard-trips">
                  {/* <div className="parent-dashboard-trips-header">
                  <h3>Trang thái</h3>
                  <span className="parent-dashboard-status-badge">
                    Chưa kích hoạt
                  </span>
                </div> */}

                  <div className="parent-dashboard-trips-list">
                    {trips.map((trip) => (
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
                              Trang trại:
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
                              Điểm đón:
                            </span>
                            <span className="parent-dashboard-pickup">
                              {trip.pickupLocation}
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
        <div className="parent-dashboard-content">{renderContent()}</div>
      </div>
    </div>
  );
}

export default ParentDashboard;
