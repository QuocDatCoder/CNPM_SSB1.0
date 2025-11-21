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

const routes = [
  {
    id: 1,
    name: "Tuyến 1",
    street: "Đường: An Dương Vương",
    time: "4:00–6:00",
    start: [10.779783, 106.699018], // Nhà thờ Đức Bà
    end: [10.779886, 106.695469], // Dinh Độc Lập
  },
  {
    id: 2,
    name: "Tuyến 2",
    street: "Đường: Lê Lợi",
    time: "5:00–7:00",
    start: [10.772461, 106.698055], // Bến Thành
    end: [10.762622, 106.682225], // Công viên 23/9
  },
  {
    id: 3,
    name: "Tuyến 3",
    street: "Đường: Nguyễn Huệ",
    time: "6:00–8:00",
    start: [10.768721, 106.704514], // Nhà hát Thành phố
    end: [10.773996, 106.700683], // Thư viện Khoa học Tổng hợp
  },
  {
    id: 4,
    name: "Tuyến 4",
    street: "Đường: Trường Chinh",
    time: "7:00–9:00",
    start: [10.804173, 106.717889], // Sân bay Tân Sơn Nhất
    end: [10.782781, 106.702271], // Bến xe Miền Đông
  },
  {
    id: 5,
    name: "Tuyến 5",
    street: "Đường: Võ Văn Kiệt",
    time: "8:00–10:00",
    start: [10.757542, 106.686234], // Bến Nghé
    end: [10.756389, 106.702639], // Chợ Bình Tây
  },
  {
    id: 6,
    name: "Tuyến 6",
    street: "Đường: Cách Mạng Tháng 8",
    time: "9:00–11:00",
    start: [10.762622, 106.682225], // Công viên 23/9
    end: [10.785411, 106.695242], // ĐH Bách Khoa
  },
];

export default function Dashboard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [busPos, setBusPos] = useState(null);
  const itemsPerPage = 4;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(routes.length - itemsPerPage, prev + 1));
  };

  const visibleRoutes = routes.slice(currentIndex, currentIndex + itemsPerPage);

  // Fetch route from OSRM
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

  // Load route 1 by default
  useEffect(() => {
    handleSelectRoute(routes[0]);
  }, []);

  return (
    <div className="dashboard">
      <div className="header">
        <div className="header-left">
          <h1>Trang chủ</h1>
        </div>
        <div className="header-right">
          <input type="text" placeholder="Tìm kiếm" className="search-input" />
          <button className="login-btn">Đăng nhập</button>
        </div>
      </div>

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
                  <p className="dashboard-route-street">{route.street}</p>
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
              <Popup>Điểm bắt đầu: {selectedRoute.street}</Popup>
            </Marker>

            {/* Marker điểm kết thúc */}
            <Marker position={selectedRoute.end} icon={endIcon}>
              <Popup>Điểm kết thúc</Popup>
            </Marker>

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
