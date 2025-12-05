import React, { useState, useEffect } from "react";
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

  // Fetch route from OSRM with retry and timeout
  async function fetchRoute(start, end, retryCount = 0, maxRetries = 3) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const TIMEOUT_MS = 30000; // 30 seconds timeout

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      console.log(
        `🔄 Fetching route (attempt ${retryCount + 1}/${maxRetries + 1})...`
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

      console.log(`✅ Route fetched: ${coords.length} points`);
      return coords;
    } catch (error) {
      console.error(
        `Error fetching route (attempt ${retryCount + 1}):`,
        error.message
      );

      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        const backoffMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return fetchRoute(start, end, retryCount + 1, maxRetries);
      }

      console.error("❌ All OSRM attempts failed");
      return [];
    }
  }

  // Handle route selection
  const handleSelectRoute = async (route) => {
    setSelectedRoute(route);
    const path = await fetchRoute(route.start, route.end);
    setRoutePath(path);
    if (path.length > 0) {
      setBusPos(path[0]);
    }
  };

  // Animation chạy xe
  useEffect(() => {
    if (routePath.length === 0) return;

    let index = 0;

    const interval = setInterval(() => {
      index++;
      if (index >= routePath.length) index = 0;

      setBusPos(routePath[index]);
    }, 200);

    return () => clearInterval(interval);
  }, [routePath]);

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
            key={selectedRoute.id}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Vẽ tuyến */}
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

            {/* Marker xe chạy */}
            {busPos && (
              <Marker position={busPos} icon={busIcon}>
                <Popup>{selectedRoute.name}</Popup>
              </Marker>
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
