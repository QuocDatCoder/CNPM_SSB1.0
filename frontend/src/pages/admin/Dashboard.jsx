import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Dashboard.css";
import RouteService from "../../services/route.service";
import Header from "../../components/common/Header/header";
import ParentTrackingService from "../../services/parent-tracking.service";

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

// Icon xe bus
const busIcon = L.icon({
  iconUrl: "/icons/busmap.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Icon điểm bắt đầu
const startIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Icon điểm kết thúc
const endIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Icon trạm dừng
const stopIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448636.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function Dashboard() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [busPos, setBusPos] = useState(null);
  const [realTimeBusPos, setRealTimeBusPos] = useState(null);
  const [activeScheduleId, setActiveScheduleId] = useState(null);
  const busListenerRef = useRef(null);
  const itemsPerPage = 4;

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const data = await RouteService.getAllRoutesWithStops();
      setRoutes(data);
      if (data.length > 0) {
        handleSelectRoute(data[0]);
      }
    } catch (error) {
      console.error("Error loading routes:", error);
      alert("Không thể tải dữ liệu tuyến đường.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(routes.length - itemsPerPage, prev + 1));
  };

  const visibleRoutes = routes.slice(currentIndex, currentIndex + itemsPerPage);

  // Fetch route from OSRM qua tất cả các trạm
  async function fetchRoute(route, retryCount = 0, maxRetries = 3) {
    // Xây dựng waypoints: start + stops + end
    let waypoints = [];

    // Điểm bắt đầu
    if (route.start && Array.isArray(route.start)) {
      waypoints.push(route.start);
    }

    // Tất cả các trạm dừng
    if (route.stops && Array.isArray(route.stops)) {
      const stopCoords = route.stops
        .filter((stop) => stop.position && Array.isArray(stop.position))
        .map((stop) => stop.position);
      waypoints.push(...stopCoords);
    }

    // Điểm kết thúc
    if (route.end && Array.isArray(route.end)) {
      waypoints.push(route.end);
    }

    if (waypoints.length < 2) {
      console.error("❌ Không đủ waypoints:", waypoints.length);
      return [];
    }

    const waypointsStr = waypoints.map((w) => `${w[1]},${w[0]}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson`;
    const TIMEOUT_MS = 30000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      console.log(
        `🔄 Fetching route qua ${waypoints.length} điểm (attempt ${
          retryCount + 1
        }/${maxRetries + 1})...`
      );

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      if (!json.routes || json.routes.length === 0) {
        console.error("No route found from OSRM");
        return [];
      }

      const coords = json.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);

      console.log(
        `✅ Route fetched: ${coords.length} points qua ${waypoints.length} waypoints`
      );
      return coords;
    } catch (error) {
      console.error(
        `Error fetching route (attempt ${retryCount + 1}):`,
        error.message
      );

      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        const backoffMs = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return fetchRoute(route, retryCount + 1, maxRetries);
      }

      console.error("❌ All OSRM attempts failed");
      return [];
    }
  }

  // Handle route selection
  const handleSelectRoute = async (route) => {
    setSelectedRoute(route);
    setRealTimeBusPos(null);
    setActiveScheduleId(null);

    console.log(`🔍 Chọn route: ${route.name} (ID: ${route.id})`);

    // Fetch active schedule cho route này
    try {
      const response = await fetch(
        `http://localhost:8080/api/schedules/route/${route.id}/active`
      );
      if (response.ok) {
        const activeSchedule = await response.json();
        if (activeSchedule && activeSchedule.id) {
          setActiveScheduleId(activeSchedule.id);
          console.log(
            `✅ Found active schedule: ${activeSchedule.id} for route ${route.id}`
          );
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not fetch active schedule: ${error.message}`);
    }

    const path = await fetchRoute(route);
    setRoutePath(path);
    if (path.length > 0) {
      setBusPos(path[0]);
    }
  };

  // Listen for real-time bus locations từ socket - giống như Bus.jsx
  useEffect(() => {
    if (!selectedRoute || !selectedRoute.id) return;

    console.log(
      `📡 Thiết lập listener vị trí xe real-time cho route ${selectedRoute.id}`
    );

    // Init socket
    const socket = ParentTrackingService.initSocket();
    console.log(`✅ Socket initialized:`, socket ? "OK" : "FAIL");

    ParentTrackingService.joinParentTracking();
    console.log(
      `✅ Joined parent-tracking room, socket connected:`,
      ParentTrackingService.socket?.connected
    );

    // Remove old listener
    ParentTrackingService.socket?.off("bus-location-update");

    const handleBusLocationUpdate = (data) => {
      console.log("📍 [DASHBOARD] Nhận bus-location-update từ socket:", data);

      // Debug: log raw data structure
      console.log("📋 Data structure:", {
        hasDriverId: !!data.driverId,
        hasRouteId: !!data.routeId,
        hasLocation: !!data.location,
        selectedRouteId: selectedRoute.id,
        dataRouteId: data.routeId,
      });

      // Chỉ lấy data từ driver (có driverId)
      if (!data.driverId) {
        console.log("⏭️ Bỏ qua - không có driverId");
        return;
      }

      // CRITICAL: Check if routeId matches selected route
      // Convert both to number for comparison (backend returns number, frontend may have leading zeros like "001")
      const dataRouteId = Number(data.routeId);
      const selectedRouteId = Number(selectedRoute.id);

      if (dataRouteId !== selectedRouteId) {
        console.log(
          `⏭️ Skip - routeId không match: data.routeId=${dataRouteId}, selectedRoute.id=${selectedRouteId}`
        );
        return;
      }

      // Update vị trí từ location object
      if (data.location) {
        const newLat = data.location.latitude;
        const newLng = data.location.longitude;

        console.log(
          `✅ [Route ${selectedRoute.id}] Updating position: lat=${newLat}, lng=${newLng}`
        );

        setRealTimeBusPos({
          latitude: newLat,
          longitude: newLng,
          timestamp: data.timestamp || new Date().toISOString(),
          scheduleId: data.scheduleId,
        });
        console.log(
          `✅ State updated - Marker sẽ hiển thị: ${newLat.toFixed(
            5
          )}, ${newLng.toFixed(5)}`
        );
      } else {
        console.warn("⚠️ data.location không tồn tại");
      }
    };

    if (ParentTrackingService.socket?.connected) {
      ParentTrackingService.socket.on(
        "bus-location-update",
        handleBusLocationUpdate
      );
      console.log(`✅ Listener attached to bus-location-update`);
    } else {
      console.warn("⚠️ Socket not connected yet, will try to listen anyway...");
      ParentTrackingService.socket?.on(
        "bus-location-update",
        handleBusLocationUpdate
      );
    }

    return () => {
      ParentTrackingService.socket?.off(
        "bus-location-update",
        handleBusLocationUpdate
      );
      console.log(`🛑 Stop listening bus-location-update`);
    };
  }, [selectedRoute, activeScheduleId]);

  return (
    <div className="dashboard">
      <Header title="Trang chủ" showSearch={true} noImage={true} />

      <div className="banner">
        <button
          className="carousel-btn prev-btn"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          ‹
        </button>

        <div className="dashboard-routes-container">
          {visibleRoutes.map((route) => (
            <div
              className={`dashboard-route-card ${
                selectedRoute?.id === route.id ? "selected" : ""
              }`}
              key={route.id}
              onClick={() => handleSelectRoute(route)}
              style={{ cursor: "pointer" }}
            >
              <div className="dashboard-route">
                <div className="dashboard-route-icon">
                  <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                    <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
                  </svg>
                </div>
                <div className="dashboard-route-name">
                  <h3>{route.name}</h3>
                </div>
              </div>

              <div className="dashboard-infor-route">
                <div className="dashboard-route-street-content">
                  <p className="dashboard-route-street">
                    Đường: {route.street}
                  </p>
                </div>
                <div className="dashboard-route-time-content">
                  <div className="dashboard-route-clock-icon">
                    <img src="/icons/clock.png" alt="Time" />
                  </div>
                  <div>
                    <p className="dashboard-route-time">{route.time}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="carousel-btn next-btn"
          onClick={handleNext}
          disabled={currentIndex >= routes.length - itemsPerPage}
        >
          ›
        </button>
      </div>

      <div className="map-section">
        {selectedRoute && (
          <MapContainer
            center={selectedRoute.start}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Vẽ tuyến đi qua tất cả trạm */}
            {routePath.length > 0 && (
              <Polyline positions={routePath} color="blue" weight={5} />
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
              selectedRoute.stops.map((stop, index) => (
                <Marker key={stop.id} position={stop.position} icon={stopIcon}>
                  <Popup>
                    <strong>{stop.name}</strong>
                    <br />
                    Giờ đến: {stop.time}
                  </Popup>
                </Marker>
              ))}

            {/* Icon xe - CHỈ hiển thị khi có vị trí real-time từ driver */}
            {realTimeBusPos && (
              <Marker
                position={[realTimeBusPos.latitude, realTimeBusPos.longitude]}
                icon={busIcon}
              >
                <Popup>
                  <div>
                    <strong>🚌 {selectedRoute.name}</strong>
                    <br />
                    <small>
                      Vị trí: {realTimeBusPos.latitude.toFixed(5)},{" "}
                      {realTimeBusPos.longitude.toFixed(5)}
                    </small>
                    <br />
                    <small>
                      Cập nhật:{" "}
                      {new Date(realTimeBusPos.timestamp).toLocaleTimeString()}
                    </small>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
