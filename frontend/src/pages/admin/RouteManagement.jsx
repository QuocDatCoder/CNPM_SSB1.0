import React, { useState, useEffect, useRef } from "react";
import Header from "../../components/common/Header/header";
import "./RouteManagement.css";
import RouteService from "../../services/route.service";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
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

// SVG marker pin xanh cho điểm đầu
// Tạo icon điểm đầu màu xanh
const startIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Tạo icon điểm cuối màu đỏ
const endIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Icon cho trạm dừng - icon location.png
const stopIcon = L.icon({
  iconUrl: "./icons/location.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

// Component để vẽ polyline nối các trạm dừng (không vẽ routing control)
const RoutingPolyline = ({ waypoints, color = "#4ade80" }) => {
  const map = useMap();
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !waypoints || waypoints.length < 2) return;

    // 🗑️ Clean up old polyline
    if (polylineRef.current) {
      try {
        map.removeLayer(polylineRef.current);
      } catch (e) {}
      polylineRef.current = null;
    }

    try {
      // Vẽ polyline đơn giản nối các trạm dừng
      polylineRef.current = L.polyline(waypoints, {
        color: color,
        opacity: 0.8,
        weight: 5,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      console.log(`✅ Polyline added with ${waypoints.length} waypoints`);
    } catch (err) {
      console.warn("Error drawing polyline:", err);
    }

    return () => {
      if (polylineRef.current) {
        try {
          map.removeLayer(polylineRef.current);
        } catch (e) {}
      }
    };
  }, [waypoints, map, color]);

  return null;
};

export default function RouteManagement() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [selectedShift, setSelectedShift] = useState({}); // Track shift selection per route

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const data = await RouteService.getAllRoutesWithStops();

      // Gộp các tuyến có cùng tên (luợt đi và về)
      const groupedRoutes = [];
      const processed = new Set();

      data.forEach((route) => {
        if (processed.has(route.id)) return;

        // Tìm tuyến ngược - lấy phần tên chung (Tuyến X) từ name
        // Ví dụ: "Tuyến 1 Lượt Đi" -> "Tuyến 1"
        const nameParts = route.name.split(" Lượt ");
        const baseName = nameParts[0]; // "Tuyến 1"

        const counterpart = data.find(
          (r) =>
            r.id !== route.id &&
            r.name.startsWith(baseName) &&
            r.loai_tuyen !== route.loai_tuyen
        );

        if (counterpart) {
          processed.add(route.id);
          processed.add(counterpart.id);

          groupedRoutes.push({
            id: route.id,
            pairId: counterpart.id,
            name: baseName,
            luot_di: route.loai_tuyen === "luot_di" ? route : counterpart,
            luot_ve: route.loai_tuyen === "luot_ve" ? route : counterpart,
            isPair: true,
          });
        } else {
          processed.add(route.id);
          groupedRoutes.push({
            ...route,
            isPair: false,
          });
        }
      });

      setRoutes(groupedRoutes);

      // Initialize selectedShift for paired routes
      const initialShifts = {};
      groupedRoutes.forEach((route) => {
        if (route.isPair) {
          initialShifts[route.id] = "luot_di";
        }
      });
      setSelectedShift(initialShifts);
    } catch (error) {
      console.error("Error loading routes:", error);
      alert(
        "Không thể tải dữ liệu tuyến đường. Vui lòng kiểm tra kết nối backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    console.log("Edit route:", id);
  };

  const handleDelete = (id) => {
    console.log("Delete route:", id);
  };

  const handleViewRoute = async (route) => {
    // Use selected shift if it's a pair, otherwise use the route itself
    let displayRoute = route;

    if (route.isPair) {
      const shift = selectedShift[route.id] || "luot_di";
      displayRoute = shift === "luot_di" ? route.luot_di : route.luot_ve;
    }

    setSelectedRoute(displayRoute);
    setShowDetailModal(true);
    // Fetch route through all stops (not just start -> end)
    const path = await fetchRouteWithStops(displayRoute);
    setRoutePath(path);
  };

  async function fetchRouteWithStops(route) {
    // Use all stops if available, otherwise use start -> end
    let waypoints = [];

    if (route.stops && route.stops.length > 0) {
      console.log("📍 Route stops:", route.stops);
      // Build waypoints array from all stops - coordinates in position array [lat, lng]
      waypoints = route.stops
        .map((stop) => {
          // Stops have position array [lat, lng]
          if (stop.position && stop.position.length === 2) {
            const lat = stop.position[0];
            const lng = stop.position[1];
            console.log(`Stop: ${stop.name}, lat: ${lat}, lng: ${lng}`);
            return [lng, lat]; // OSRM format: [lng, lat]
          }
          return null;
        })
        .filter((w) => w !== null);
    } else {
      // Fallback to start -> end
      waypoints = [
        [route.start[1], route.start[0]],
        [route.end[1], route.end[0]],
      ];
    }

    if (waypoints.length < 2) {
      console.warn("Not enough valid waypoints for routing");
      return [];
    }

    // Build OSRM URL with all waypoints
    const waypointsStr = waypoints.map((w) => `${w[0]},${w[1]}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson`;
    console.log("🔗 OSRM URL:", url);

    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!json.routes) {
        console.warn("No routes returned from OSRM");
        return [];
      }
      const coords = json.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);
      console.log("✅ Route fetched with", waypoints.length, "waypoints");
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
          {filteredRoutes.map((route, index) => {
            // Lấy shift được chọn, mặc định lượt_di cho tuyến cặp
            const currentShift = route.isPair
              ? selectedShift[route.id] || "luot_di"
              : null;
            const currentRoute = route.isPair
              ? currentShift === "luot_di"
                ? route.luot_di
                : route.luot_ve
              : route;

            return (
              <div className="route-card" key={route.id || index}>
                {/* Shift tabs for paired routes */}
                {route.isPair && (
                  <div className="route-shift-tabs">
                    <button
                      className={`route-shift-tab ${
                        currentShift === "luot_di" ? "active" : ""
                      }`}
                      onClick={() =>
                        setSelectedShift({
                          ...selectedShift,
                          [route.id]: "luot_di",
                        })
                      }
                    >
                      Lượt đi
                    </button>
                    <button
                      className={`route-shift-tab ${
                        currentShift === "luot_ve" ? "active" : ""
                      }`}
                      onClick={() =>
                        setSelectedShift({
                          ...selectedShift,
                          [route.id]: "luot_ve",
                        })
                      }
                    >
                      Lượt về
                    </button>
                  </div>
                )}
                <div className="route-map-container">
                  <img
                    src={currentRoute.mapImage}
                    alt="Map"
                    className="route-map"
                  />
                </div>
                <div className="routemgmt-info">
                  <div className="routemgmt-details">
                    <p className="routemgmt-name">{route.name}</p>
                    <p className="routemgmt-distance">
                      Độ dài: {currentRoute.distance}
                    </p>
                    <p className="routemgmt-duration">
                      Thời gian dự định: {currentRoute.duration}
                    </p>
                    <p className="routemgmt-stations">
                      Số trạm: {currentRoute.stops.length} trạm
                    </p>
                    <p className="routemgmt-endpoints">
                      Điểm đầu/cuối: {currentRoute.startName},{" "}
                      {currentRoute.endName}
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
                          onClick={() => handleEdit(currentRoute.id)}
                          title="Chỉnh sửa"
                        >
                          <img src="/icons/edit.png" alt="Edit" />
                        </button>
                      </div>
                      <div className="routemgmt-delete-btn-container">
                        <button
                          className="routemgmt-action-btn routemgmt-delete-btn"
                          onClick={() => handleDelete(currentRoute.id)}
                          title="Xóa"
                        >
                          <img src="/icons/delete.png" alt="Delete" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
                          width: "100%",
                          borderRadius: "8px",
                        }}
                        key={selectedRoute.id}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {/* Vẽ tuyến đường thực tế qua tất cả điểm */}
                        {routePath.length > 1 && (
                          <RoutingPolyline
                            waypoints={routePath}
                            color="#4ade80"
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

                        {/* Marker các trạm dừng (loại bỏ điểm đầu và cuối) */}
                        {selectedRoute.stops &&
                          selectedRoute.stops
                            .filter(
                              (stop) =>
                                !(
                                  (stop.position[0] ===
                                    selectedRoute.start[0] &&
                                    stop.position[1] ===
                                      selectedRoute.start[1]) ||
                                  (stop.position[0] === selectedRoute.end[0] &&
                                    stop.position[1] === selectedRoute.end[1])
                                )
                            )
                            .map((stop) => (
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
