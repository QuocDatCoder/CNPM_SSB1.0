import React, { useState, useEffect } from "react";
import Header from "../../components/common/Header/header";
import "./RouteManagement.css";
import { routes as routeData } from "../../data/routes";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const startIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const endIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const stopIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448636.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function RouteManagement() {
  const [routes, setRoutes] = useState(routeData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routePath, setRoutePath] = useState([]);

  const handleEdit = (id) => {
    console.log("Edit route:", id);
  };

  const handleDelete = (id) => {
    console.log("Delete route:", id);
  };

  const handleViewRoute = async (route) => {
    setSelectedRoute(route);
    setShowDetailModal(true);
    // Fetch route from OSRM
    const path = await fetchRoute(route.start, route.end);
    setRoutePath(path);
  };

  async function fetchRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!json.routes) return [];
      const coords = json.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);
      return coords;
    } catch (error) {
      console.error("Error fetching route:", error);
      return [];
    }
  }

  const handleAdd = () => {
    console.log("Add new route");
  };

  const filteredRoutes = routes.filter(
    (route) =>
      route.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="route-page">
      <Header title="Tuyến đường" />

      <div className="route-content">
        <div className="route-grid">
          {filteredRoutes.map((route, index) => (
            <div className="route-card" key={index}>
              <div className="route-map-container">
                <img src={route.mapImage} alt="Map" className="route-map" />
              </div>
              <div className="routemgmt-info">
                <div className="routemgmt-details">
                  <p className="routemgmt-id">Mã: {route.id}</p>
                  <p className="routemgmt-distance">Độ dài: {route.distance}</p>
                  <p className="routemgmt-duration">
                    Thời gian dự định: {route.duration}
                  </p>
                  <p className="routemgmt-stations">
                    Số trạm: {route.stops.length} trạm
                  </p>
                  <p className="routemgmt-endpoints">
                    Điểm đầu/cuối: {route.startName}, {route.endName}
                  </p>
                </div>
                <div className="routemgmt-actions">
                  <div className="routemgmt-view-btn-container">
                    <button
                      className="routemgmt-action-btn routemgmt-view-btn"
                      onClick={() => handleViewRoute(route)}
                      title="Xem tuyến"
                    >
                      <span className="routemgmt-icon">📍</span>
                      Xem tuyến
                    </button>
                  </div>

                  <div className="routemgmt-edit-delete-btn">
                    <div className="routemgmt-edit-btn-container">
                      <button
                        className="routemgmt-action-btn routemgmt-edit-btn"
                        onClick={() => handleEdit(route.id)}
                        title="Chỉnh sửa"
                      >
                        <img src="/icons/edit.png" alt="Edit" />
                      </button>
                    </div>
                    <div className="routemgmt-delete-btn-container">
                      <button
                        className="routemgmt-action-btn routemgmt-delete-btn"
                        onClick={() => handleDelete(route.id)}
                        title="Xóa"
                      >
                        <img src="/icons/delete.png" alt="Delete" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="route-add-btn"
          onClick={handleAdd}
          title="Thêm tuyến đường mới"
        >
          <span className="route-plus-icon">+</span>
        </button>
      </div>

      {/* Modal xem chi tiết tuyến */}
      {showDetailModal && selectedRoute && (
        <div
          className="route-modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div className="route-modal" onClick={(e) => e.stopPropagation()}>
            <div className="route-modal-header">
              <h2>Chi tiết {selectedRoute.name}</h2>
              <button
                className="route-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className="route-modal-body">
              <div className="route-detail-section">
                <h3>Thông tin chung</h3>
                <div className="route-info-grid">
                  <div className="route-info-grid-left">
                    <div className="route-info-row">
                      <span className="route-info-label">Mã tuyến:</span>
                      <span className="route-info-value">
                        {selectedRoute.id}
                      </span>
                    </div>
                    <div className="route-info-row">
                      <span className="route-info-label">Tên tuyến:</span>
                      <span className="route-info-value">
                        {selectedRoute.name}
                      </span>
                    </div>
                    <div className="route-info-row">
                      <span className="route-info-label">Đường đi:</span>
                      <span className="route-info-value">
                        {selectedRoute.street}
                      </span>
                    </div>
                    <div className="route-info-row">
                      <span className="route-info-label">Độ dài:</span>
                      <span className="route-info-value">
                        {selectedRoute.distance}
                      </span>
                    </div>
                  </div>
                  <div className="route-info-grid-right">
                    <div className="route-info-row">
                      <span className="route-info-label">
                        Thời gian dự kiến:
                      </span>
                      <span className="route-info-value">
                        {selectedRoute.duration}
                      </span>
                    </div>
                    <div className="route-info-row">
                      <span className="route-info-label">Giờ hoạt động:</span>
                      <span className="route-info-value">
                        {selectedRoute.time}
                      </span>
                    </div>
                    <div className="route-info-row">
                      <span className="route-info-label">Điểm đầu:</span>
                      <span className="route-info-value">
                        {selectedRoute.startName}
                      </span>
                    </div>
                    <div className="route-info-row">
                      <span className="route-info-label">Điểm cuối:</span>
                      <span className="route-info-value">
                        {selectedRoute.endName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="route-infor-content">
                <div className="route-detail-section">
                  <h3>Các trạm dừng ({selectedRoute.stops.length} trạm)</h3>
                  <div className="route-stops-list">
                    {selectedRoute.stops.map((stop, index) => (
                      <div key={stop.id} className="route-stop-item">
                        <div className="route-stop-number">
                          {/* {index + 1} */}
                          <img src="./icons/location.png" alt="location" />
                        </div>
                        <div className="route-stop-info">
                          <div className="route-stop-name">{stop.name}</div>
                          <div className="route-stop-time">
                            <span className="route-stop-time-icon">🕐</span>{" "}
                            {stop.time}
                          </div>
                        </div>
                        {index < selectedRoute.stops.length - 1 && (
                          <div className="route-stop-connector"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="route-detail-section">
                  <h3>Bản đồ tuyến đường</h3>
                  <div className="route-map-view">
                    {selectedRoute && (
                      <MapContainer
                        center={selectedRoute.start}
                        zoom={13}
                        style={{
                          height: "400px",
                          width: "60%",
                          borderRadius: "8px",
                        }}
                        key={selectedRoute.id}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {/* Vẽ tuyến */}
                        {routePath.length > 0 && (
                          <Polyline
                            positions={routePath}
                            color="#4ade80"
                            weight={5}
                          />
                        )}

                        {/* Marker điểm bắt đầu */}
                        <Marker position={selectedRoute.start} icon={startIcon}>
                          <Popup>Điểm bắt đầu: {selectedRoute.startName}</Popup>
                        </Marker>

                        {/* Marker điểm kết thúc */}
                        <Marker position={selectedRoute.end} icon={endIcon}>
                          <Popup>Điểm kết thúc: {selectedRoute.endName}</Popup>
                        </Marker>

                        {/* Marker các trạm dừng */}
                        {selectedRoute.stops &&
                          selectedRoute.stops.map((stop) => (
                            <Marker
                              key={stop.id}
                              position={stop.position}
                              icon={stopIcon}
                            >
                              <Popup>
                                <strong>{stop.name}</strong>
                                <br />
                                Giờ đến: {stop.time}
                              </Popup>
                            </Marker>
                          ))}
                      </MapContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="route-modal-footer">
              <button
                className="route-btn-close"
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
