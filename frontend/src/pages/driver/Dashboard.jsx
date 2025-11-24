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
import Header from "../../components/common/Header/header";
import Sidebar from "../../components/common/Sidebar/Sidebar";
import Assignments from "./Assignments";
import Students from "./Students";
import Notifications from "./Notifications";
import "./Dashboard.css";
import drivers from "../../data/drivers";

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const driverMenu = [
  { icon: "/icons/home.png", label: "Trang chủ" },
  { icon: "/icons/schedule.png", label: "Xem lịch trình phân công" },
  { icon: "/icons/student.png", label: "Danh sách học sinh" },
  { icon: "/icons/message.png", label: "Thông báo" },
];

function Home() {
  const [tripStarted, setTripStarted] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);
  const [selectedStation, setSelectedStation] = useState(0);

  // Current driver info (replace with real auth data)
  const driver = {
    fullname: "Nguyễn Văn A",
    date: "Thứ Hai, 28/10/2024",
  };

  // Sample assigned routes with map coordinates
  const assignedRoutes = [
    {
      id: 1,
      shift: "Sáng",
      name: "Tuyến đi buổi sáng",
      time: "07:00",
      startTime: "Lộ trạm đầu tiên: 07:00",
      school: "Trường ABC",
      students: 30,
      type: "morning",
      coordinates: [
        [10.762622, 106.660172],
        [10.771513, 106.677887],
        [10.773431, 106.688034],
        [10.776889, 106.700928],
      ],
      stations: [
        {
          id: 1,
          name: "Đại học Sài Gòn",
          time: "6:30 - 6:45",
          status: "completed",
        },
        { id: 2, name: "KTX Khu B", time: "07:00 - 07:45", status: "active" },
        {
          id: 3,
          name: "Chợ Thủ Đức",
          time: "Dự kiến đến: 4 học sinh",
          status: "pending",
        },
        {
          id: 4,
          name: "Nơi từ Gò Dưa",
          time: "Dự kiến đến: 4 học sinh",
          status: "pending",
        },
      ],
    },
    {
      id: 2,
      shift: "Chiều",
      name: "Tuyến về buổi chiều",
      time: "16:30",
      startTime: "Lộ trạm đầu tiên: 16:30",
      school: "Trường ABC",
      students: 30,
      type: "afternoon",
      coordinates: [
        [10.776889, 106.700928],
        [10.773431, 106.688034],
        [10.771513, 106.677887],
        [10.762622, 106.660172],
      ],
      stations: [
        { id: 1, name: "Trường ABC", time: "16:30 - 16:45", status: "pending" },
        {
          id: 2,
          name: "Chợ Thủ Đức",
          time: "16:50 - 17:00",
          status: "pending",
        },
        { id: 3, name: "KTX Khu B", time: "17:05 - 17:15", status: "pending" },
        {
          id: 4,
          name: "Đại học Sài Gòn",
          time: "17:20 - 17:30",
          status: "pending",
        },
      ],
    },
  ];

  const handleStartTrip = (route) => {
    setActiveTrip(route);
    setTripStarted(true);
    setSelectedStation(0);
  };

  const handleEndTrip = () => {
    setTripStarted(false);
    setActiveTrip(null);
    setSelectedStation(0);
  };

  // If trip is started, show active trip view
  if (tripStarted && activeTrip) {
    return (
      <div className="driver-active-trip-page">
        {/* Top Info Cards */}
        <div className="trip-info-cards">
          <div className="trip-info-card">
            <div className="card-icon-trip">
              <img src="./icons/bus.png" alt="BusDriver" />
            </div>
            <div className="card-content">
              <h4>Tuyến đi buổi sáng</h4>
              <p className="trip-status-badge active">Đang đi chuyến</p>
            </div>
          </div>

          <div className="trip-info-card">
            <div className="card-icon-trip">📍</div>
            <div className="card-content">
              <h4>Bến xe ➜ Trường ABC</h4>
              <p className="trip-time">07:00 - 07:45</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="active-trip-content-grid">
          {/* Left: Map */}
          <div className="active-trip-map-section">
            <div className="map-container-active">
              <MapContainer
                center={
                  activeTrip.coordinates[selectedStation] ||
                  activeTrip.coordinates[0]
                }
                zoom={13}
                style={{ height: "100%", width: "100%", borderRadius: "8px" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                <Polyline
                  positions={activeTrip.coordinates}
                  color="#3b82f6"
                  weight={5}
                  opacity={0.8}
                />

                {activeTrip.coordinates.map((coord, index) => (
                  <Marker key={index} position={coord}>
                    <Popup>
                      {activeTrip.stations[index]?.name || `Trạm ${index + 1}`}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Right: Station List */}
          <div className="station-list-section">
            <div className="station-list-header">
              <button className="btn-driver-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Tài xế
              </button>
              <span className="search-label">
                Xem sau
                <br />
                Bà Hạc
              </span>
            </div>

            <h3 className="station-list-title">Danh sách trạm dừng</h3>

            <div className="stations-list">
              {activeTrip.stations.map((station, index) => (
                <div
                  key={station.id}
                  className={`station-item ${
                    index === selectedStation ? "selected" : ""
                  } ${station.status}`}
                  onClick={() => setSelectedStation(index)}
                >
                  <div className="station-number">
                    {station.status === "completed" ? (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    ) : index === selectedStation ? (
                      <div className="active-indicator"></div>
                    ) : (
                      <div className="pending-indicator"></div>
                    )}
                  </div>
                  <div className="station-info">
                    <h4>{station.name}</h4>
                    <p>{station.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-end-trip" onClick={handleEndTrip}>
              Kết thúc chuyến đi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default view - show route cards

  return (
    <div className="driver-home-page">
      <Header title="Trang chủ" showSearch={false} />

      <div className="driver-home-content">
        {/* Greeting Header */}
        <div className="driver-greeting">
          <h2>Chào buổi sáng, {driver.fullname}!</h2>
          <p className="driver-date">{driver.date}</p>
        </div>

        {/* Main Content Grid */}
        <div className="driver-content-grid">
          {/* Left: Assigned Routes */}
          <div className="assigned-routes-section-driver">
            <h3>Các chuyến đi được phân công hôm nay</h3>

            <div className="routes-cards-driver">
              {assignedRoutes.map((route) => (
                <div key={route.id} className="route-card-driver">
                  <div className="status-routes-cards-driver">Sắp tới</div>
                  <div className="route-card-header-driver">
                    <span className={`shift-badge-driver ${route.type}`}>
                      {route.shift}
                    </span>
                    <h4>{route.name}</h4>
                  </div>

                  <div className="route-card-body-driver">
                    <p className="route-info-driver">
                      <strong>Thời gian đầu tiên:</strong> {route.startTime}. Lộ
                      trạm: đến xe ⇨ {route.school}
                    </p>
                    <p className="route-info-driver">
                      Số học sinh trên chuyến: {route.students}
                    </p>
                  </div>

                  <button
                    className="btn-start-route-driver"
                    onClick={() => handleStartTrip(route)}
                  >
                    Bắt đầu chuyến đi
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Route Overview Map */}
          <div className="route-overview-section-driver">
            <h3>Tổng quan tuyến đường</h3>

            <div className="map-container-driver">
              <MapContainer
                center={[10.771513, 106.677887]}
                zoom={13}
                style={{ height: "100%", width: "100%", borderRadius: "8px" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* Draw routes on map */}
                {assignedRoutes.map((route) => (
                  <React.Fragment key={route.id}>
                    <Polyline
                      positions={route.coordinates}
                      color={route.type === "morning" ? "#3b82f6" : "#f59e0b"}
                      weight={4}
                      opacity={0.7}
                    />

                    {/* Start marker */}
                    <Marker position={route.coordinates[0]}>
                      <Popup>
                        <strong>{route.name}</strong>
                        <br />
                        Điểm đầu
                        <br />
                        {route.startTime}
                      </Popup>
                    </Marker>

                    {/* End marker */}
                    <Marker
                      position={route.coordinates[route.coordinates.length - 1]}
                    >
                      <Popup>
                        <strong>{route.name}</strong>
                        <br />
                        Điểm cuối - {route.school}
                      </Popup>
                    </Marker>
                  </React.Fragment>
                ))}
              </MapContainer>
            </div>

            <div className="map-placeholder-text-driver">300×300</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const [page, setPage] = useState("Trang chủ");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [sendToParents, setSendToParents] = useState(false);
  const [sendToAdmin, setSendToAdmin] = useState(true);
  const [alertType, setAlertType] = useState("");

  function renderContent() {
    switch (page) {
      case "Xem lịch trình phân công":
        return <Assignments />;
      case "Danh sách học sinh":
        return <Students />;
      case "Thông báo":
        return <Notifications />;
      case "Trang chủ":
      default:
        return <Home />;
    }
  }
  function handleSidebarSelect(label) {
    if (label === "Gửi cảnh báo") {
      setShowAlertModal(true);
      return;
    }

    setPage(label);
  }

  function sendAlert() {
    const payload = {
      type: alertType,
      message: alertMessage,
      toParents: sendToParents,
      toAdmin: sendToAdmin || sendToParents,
    };
    console.log("Sending alert:", payload);
    // TODO: call backend API to send alert
    // close modal after send
    setShowAlertModal(false);
    setAlertMessage("");
    setSendToParents(false);
    setSendToAdmin(true);
    setAlertType("");
  }

  return (
    <div className="driver-app-container">
      <Sidebar
        active={page}
        onSelect={handleSidebarSelect}
        menuItems={driverMenu}
        showAlertButton={true}
      />
      <div className="driver-page">
        <div className="driver-content">{renderContent()}</div>
      </div>

      {showAlertModal && (
        <div
          className="alert-modal-overlay"
          onClick={() => {
            setShowAlertModal(false);
            setAlertMessage("");
            setSendToParents(false);
            setSendToAdmin(true);
            setAlertType("");
          }}
        >
          <div
            className="alert-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3>Gửi cảnh báo</h3>

            <textarea
              className="alert-textarea"
              placeholder="Nhập nội dung cảnh báo..."
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
            />

            <div className="alert-type">
              <p>Loại cảnh báo:</p>
              <label>
                <input
                  type="radio"
                  name="alertType"
                  value="su-co-xe"
                  checked={alertType === "su-co-xe"}
                  onChange={(e) => setAlertType(e.target.value)}
                />{" "}
                Sự cố xe
              </label>

              <label>
                <input
                  type="radio"
                  name="alertType"
                  value="su-co-giao-thong"
                  checked={alertType === "su-co-giao-thong"}
                  onChange={(e) => setAlertType(e.target.value)}
                />{" "}
                Sự cố giao thông
              </label>

              <label>
                <input
                  type="radio"
                  name="alertType"
                  value="su-co-y-te"
                  checked={alertType === "su-co-y-te"}
                  onChange={(e) => setAlertType(e.target.value)}
                />{" "}
                Sự cố y tế (học sinh)
              </label>

              <label>
                <input
                  type="radio"
                  name="alertType"
                  value="khac"
                  checked={alertType === "khac"}
                  onChange={(e) => setAlertType(e.target.value)}
                />{" "}
                Khác
              </label>
            </div>

            <div className="alert-options">
              <label>
                <input
                  type="checkbox"
                  checked={sendToParents}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setSendToParents(v);
                    if (v) setSendToAdmin(true);
                  }}
                />{" "}
                Gửi cho phụ huynh (kèm Admin)
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={sendToAdmin}
                  disabled={sendToParents}
                  onChange={(e) => setSendToAdmin(e.target.checked)}
                />{" "}
                Gửi cho Admin
              </label>
            </div>

            <div className="alert-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAlertModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={sendAlert}
                disabled={!alertMessage.trim()}
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
