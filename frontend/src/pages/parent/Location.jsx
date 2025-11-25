import React from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Header from "../../components/common/Header/header";
import "./Location.css";

function Location() {
  // Student info
  const studentInfo = {
    name: "Nguyễn Văn A",
    class: "Lớp 5B",
  };

  // Trip info
  const tripInfo = {
    driver: "Trần B",
    busNumber: "51A-123.45",
    status: "Đang đến điểm đón",
    statusColor: "#f59e0b",
    arrivalTime: "8 phút",
    distance: "2.5 km",
  };

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

  return (
    <div className="parent-location-page">
      <Header title="Vị trí" showSearch={false} />
      <div className="parent-location-container">
        {/* Left Panel - Student & Trip Info */}
        <div className="parent-location-sidebar">
          {/* Student Info Card */}
          <div className="parent-location-student-card">
            <div className="parent-location-student-avatar">
              <img src="/image/avatar2.png" alt="Student" />
            </div>
            <div className="parent-location-student-info">
              <h3>{studentInfo.name}</h3>
              <p>{studentInfo.class}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="parent-location-menu">
            <div className="parent-location-menu-item active">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>Theo dõi Lộ trình</span>
            </div>
          </div>

          {/* Trip Information */}
          <div className="parent-location-trip-info">
            <h4>Thông tin chuyến đi</h4>

            <div className="parent-location-info-row">
              <span className="parent-location-label">Tài xế:</span>
              <span className="parent-location-value">{tripInfo.driver}</span>
            </div>

            <div className="parent-location-info-row">
              <span className="parent-location-label">Biển số xe:</span>
              <span className="parent-location-value">
                {tripInfo.busNumber}
              </span>
            </div>

            <div className="parent-location-info-row">
              <span className="parent-location-label">Trạng thái:</span>
              <span
                className="parent-location-status"
                style={{ color: tripInfo.statusColor }}
              >
                {tripInfo.status}
              </span>
            </div>

            <button className="parent-location-call-btn">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
              </svg>
              Gọi cho tài xế
            </button>

            <div className="parent-location-stats">
              <div className="parent-location-stat">
                <span className="parent-location-stat-label">
                  Sắp đến trong
                </span>
                <span className="parent-location-stat-value">
                  {tripInfo.arrivalTime}
                </span>
              </div>
              <div className="parent-location-stat">
                <span className="parent-location-stat-label">Khoảng cách</span>
                <span className="parent-location-stat-value">
                  {tripInfo.distance}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="parent-location-map-panel">
          {/* Search Bar */}
          <div className="parent-location-search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm địa điểm"
              className="parent-location-search-input"
            />
          </div>

          {/* Map Container */}
          <div className="parent-location-map-container">
            <MapContainer
              center={[21.0555, 105.8142]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Polyline
                positions={routeCoordinates}
                color="#3b82f6"
                weight={5}
                opacity={0.8}
              />
              <Marker position={routeCoordinates[0]}>
                <Popup>Điểm bắt đầu</Popup>
              </Marker>
              <Marker position={routeCoordinates[routeCoordinates.length - 1]}>
                <Popup>Trường học</Popup>
              </Marker>
            </MapContainer>

            {/* Map Controls */}
            <div className="parent-location-map-controls">
              <button className="parent-location-zoom-btn">+</button>
              <button className="parent-location-zoom-btn">-</button>
            </div>

            {/* Center Button */}
            <button className="parent-location-center-btn">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Location;
