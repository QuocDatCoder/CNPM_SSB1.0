import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
// Import routing machine CSS using direct path for Vite compatibility
import "../../../node_modules/leaflet-routing-machine/dist/leaflet-routing-machine.css";
import Header from "../../components/common/Header/header";
import Sidebar from "../../components/common/Sidebar/Sidebar";
import Assignments from "./Assignments";
import Students from "./Students";
import Notifications from "./Notifications";
import "./Dashboard.css";
import drivers from "../../data/drivers";
import ScheduleService from "../../services/schedule.service";
import TrackingService from "../../services/tracking.service";
import useDriverScheduleSocket from "../../hooks/useDriverScheduleSocket";

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

// 🚌 Icon xe bus động
const busIcon = L.icon({
  iconUrl: "/icons/busmap.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Component để vẽ routing thực tế giữa các điểm
const RoutingPolyline = ({ waypoints, color = "#3b82f6" }) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const fallbackPolylineRef = useRef(null);

  useEffect(() => {
    if (!map || !waypoints || waypoints.length < 2) return;

    // Làm sạch trước khi tạo mới
    if (routingControlRef.current && map.hasLayer(routingControlRef.current)) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    if (
      fallbackPolylineRef.current &&
      map.hasLayer(fallbackPolylineRef.current)
    ) {
      map.removeLayer(fallbackPolylineRef.current);
      fallbackPolylineRef.current = null;
    }

    try {
      // Tạo routing control mới
      routingControlRef.current = L.Routing.control({
        waypoints: waypoints.map((coord) => L.latLng(coord[0], coord[1])),
        lineOptions: {
          styles: [
            {
              color: color,
              opacity: 0.8,
              weight: 5,
              lineCap: "round",
              lineJoin: "round",
            },
          ],
        },
        show: false, // Hide turn-by-turn instructions
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
        }),
      });

      routingControlRef.current.addTo(map);
    } catch (err) {
      console.warn("Routing error, using fallback polyline:", err);
      // Fallback: vẽ polyline thẳng
      if (map) {
        fallbackPolylineRef.current = L.polyline(waypoints, {
          color: color,
          opacity: 0.8,
          weight: 5,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }
    }

    return () => {
      if (
        routingControlRef.current &&
        map.hasLayer(routingControlRef.current)
      ) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (
        fallbackPolylineRef.current &&
        map.hasLayer(fallbackPolylineRef.current)
      ) {
        map.removeLayer(fallbackPolylineRef.current);
      }
    };
  }, [waypoints, map, color]);

  return null;
};

const driverMenu = [
  { icon: "/icons/home.png", label: "Trang chủ" },
  { icon: "/icons/schedule.png", label: "Xem lịch trình phân công" },
  { icon: "/icons/student.png", label: "Danh sách học sinh" },
  { icon: "/icons/message.png", label: "Thông báo" },
];

function Home() {
  // Get current driver info
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  // Initialize state from sessionStorage to persist trip state across page navigations
  const [tripStarted, setTripStarted] = useState(() => {
    const saved = sessionStorage.getItem("tripStarted");
    return saved ? JSON.parse(saved) : false;
  });

  const [activeTrip, setActiveTrip] = useState(() => {
    const saved = sessionStorage.getItem("activeTrip");
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedStation, setSelectedStation] = useState(() => {
    const saved = sessionStorage.getItem("selectedStation");
    return saved ? JSON.parse(saved) : 0;
  });

  const [assignedRoutes, setAssignedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [tripProgress, setTripProgress] = useState({
    percentage: 0,
    distanceCovered: 0,
    currentStop: null,
  });
  const [routePath, setRoutePath] = useState([]); // 🚌 Lưu đường đi thực tế
  const [busPos, setBusPos] = useState(null); // 🚌 Vị trí hiện tại của xe

  const driver = {
    fullname: user.ho_ten || user.ten_tai_xe || user.name || "Tài xế",
    date: new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
  };

  // Save trip state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("tripStarted", JSON.stringify(tripStarted));
  }, [tripStarted]);

  useEffect(() => {
    sessionStorage.setItem("activeTrip", JSON.stringify(activeTrip));
  }, [activeTrip]);

  useEffect(() => {
    sessionStorage.setItem("selectedStation", JSON.stringify(selectedStation));
  }, [selectedStation]);

  // Fetch today's schedule from backend
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching schedule for driver:", user);
        console.log(
          "🔍 Token in sessionStorage:",
          sessionStorage.getItem("token")
        );
        const response = await ScheduleService.getMySchedule();

        console.log("✅ Schedule response:", response);
        console.log("✅ Full response keys:", Object.keys(response));

        // Get today's date in YYYY-MM-DD format (local time, not UTC)
        const today = new Date().toLocaleDateString("en-CA"); // Format: YYYY-MM-DD in local time
        console.log("🔍 Today's date (local):", today);

        const todaySchedules = response[today] || [];
        console.log("🔍 Today's schedules found:", todaySchedules.length); // Transform backend data to component format
        const routes = todaySchedules.map((schedule) => {
          // Convert stops array to stations format and extract coordinates
          let stations = [];
          let coordinates = [];

          if (schedule.stops && Array.isArray(schedule.stops)) {
            // Backend trả về stops có cấu trúc: { id, ten_diem, dia_chi, latitude, longitude }
            stations = schedule.stops.map((stop, index) => ({
              id: stop.id || index + 1,
              name: stop.ten_diem || stop.name || `Trạm ${index + 1}`,
              address: stop.dia_chi || "",
              time:
                index === 0
                  ? schedule.time
                  : index === schedule.stops.length - 1
                  ? "Dự kiến đến"
                  : "",
              status: "pending",
            }));

            // Extract coordinates từ stops
            coordinates = schedule.stops.map((stop) => [
              parseFloat(stop.latitude),
              parseFloat(stop.longitude),
            ]);
          } else {
            // Fallback if no stops provided
            stations = [
              {
                id: 1,
                name: schedule.startLocation || "Điểm khởi hành",
                address: "",
                time: schedule.time,
                status: "pending",
              },
              {
                id: 2,
                name: schedule.endLocation || "Điểm kết thúc",
                address: "",
                time: "Dự kiến đến",
                status: "pending",
              },
            ];
            // Default coordinates if no stops
            coordinates = [
              [10.762622, 106.660172],
              [10.776889, 106.700928],
            ];
          }

          // Normalize type: backend can return "luot_di"/"luot_ve" or "morning"/"afternoon"
          const scheduleType =
            schedule.type === "luot_di" || schedule.type === "morning"
              ? "morning"
              : "afternoon";

          return {
            id: schedule.id,
            shift: scheduleType === "morning" ? "Sáng" : "Chiều",
            name:
              schedule.title ||
              (scheduleType === "morning"
                ? "Lượt đi buổi sáng"
                : "Lượt về buổi chiều"),
            time: schedule.time,
            startTime: `Lộ trạm đầu tiên: ${schedule.time}`,
            school: schedule.endLocation || "Trường học",
            students: 0, // Will be updated if we fetch student list
            type: scheduleType,
            route: schedule.route || "",
            startLocation: schedule.startLocation || "",
            endLocation: schedule.endLocation || "",
            status: schedule.status || "chuabatdau",
            stops: schedule.stops || [],
            coordinates: coordinates,
            stations: stations,
          };
        });

        setAssignedRoutes(routes);
        setError(null);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError("Không thể tải lịch trình. Vui lòng thử lại.");
        // Set empty routes on error instead of showing hardcoded data
        setAssignedRoutes([]);
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
      console.log("📢 New schedule notification:", data);

      const schedule = data.data;
      const today = new Date().toISOString().split("T")[0];

      if (schedule.date === today) {
        // Convert stops array to stations format and extract coordinates
        let stations = [];
        let coordinates = [];

        if (schedule.stops && Array.isArray(schedule.stops)) {
          stations = schedule.stops.map((stop, index) => ({
            id: stop.id || index + 1,
            name: stop.ten_diem || stop.name || `Trạm ${index + 1}`,
            address: stop.dia_chi || "",
            time:
              index === 0
                ? schedule.time
                : index === schedule.stops.length - 1
                ? "Dự kiến đến"
                : "",
            status: "pending",
          }));

          coordinates = schedule.stops.map((stop) => [
            parseFloat(stop.latitude),
            parseFloat(stop.longitude),
          ]);
        } else {
          stations = [
            {
              id: 1,
              name: schedule.startLocation || "Điểm khởi hành",
              address: "",
              time: `${schedule.time?.substring(0, 5) || schedule.time}`,
              status: "pending",
            },
            {
              id: 2,
              name: schedule.endLocation || "Điểm kết thúc",
              address: "",
              time: "Dự kiến đến",
              status: "pending",
            },
          ];
          coordinates = [
            [10.762622, 106.660172],
            [10.776889, 106.700928],
          ];
        }

        // Cập nhật state routes với lịch mới mà không reload
        setAssignedRoutes((prevRoutes) => [
          ...prevRoutes,
          {
            id: schedule.id,
            shift: schedule.type === "luot_di" ? "Sáng" : "Chiều",
            name:
              schedule.title ||
              (schedule.type === "luot_di"
                ? "Lượt đi buổi sáng"
                : "Lượt về buổi chiều"),
            time: schedule.time?.substring(0, 5) || schedule.time,
            startTime: `Lộ trạm đầu tiên: ${
              schedule.time?.substring(0, 5) || schedule.time
            }`,
            school: schedule.endLocation || "Trường học",
            students: 0,
            type: schedule.type === "luot_di" ? "morning" : "afternoon",
            route: schedule.route || "",
            startLocation: schedule.startLocation || "",
            endLocation: schedule.endLocation || "",
            status: schedule.status || "chuabatdau",
            stops: schedule.stops || [],
            coordinates: coordinates,
            stations: stations,
          },
        ]);
      }
    },
    (data) => {
      // Khi lịch được cập nhật: cập nhật real-time không cần reload
      console.log("📝 Schedule update notification:", data);

      const schedule = data.data;
      const today = new Date().toISOString().split("T")[0];

      if (schedule.date === today) {
        // Nếu là hôm nay thì update trực tiếp
        setAssignedRoutes((prevRoutes) => {
          // Xóa lịch cũ ra khỏi danh sách
          const filtered = prevRoutes.filter(
            (route) => route.id !== schedule.id
          );

          // Convert stops array to stations format and extract coordinates
          let stations = [];
          let coordinates = [];

          if (schedule.stops && Array.isArray(schedule.stops)) {
            stations = schedule.stops.map((stop, index) => ({
              id: stop.id || index + 1,
              name: stop.ten_diem || stop.name || `Trạm ${index + 1}`,
              address: stop.dia_chi || "",
              time:
                index === 0
                  ? schedule.time
                  : index === schedule.stops.length - 1
                  ? "Dự kiến đến"
                  : "",
              status: "pending",
            }));

            coordinates = schedule.stops.map((stop) => [
              parseFloat(stop.latitude),
              parseFloat(stop.longitude),
            ]);
          } else {
            stations = [
              {
                id: 1,
                name: schedule.startLocation || "Điểm khởi hành",
                address: "",
                time: `${schedule.time?.substring(0, 5) || schedule.time}`,
                status: "pending",
              },
              {
                id: 2,
                name: schedule.endLocation || "Điểm kết thúc",
                address: "",
                time: "Dự kiến đến",
                status: "pending",
              },
            ];
            coordinates = [
              [10.762622, 106.660172],
              [10.776889, 106.700928],
            ];
          }

          // Thêm lịch cập nhật vào
          return [
            ...filtered,
            {
              id: schedule.id,
              shift: schedule.type === "luot_di" ? "Sáng" : "Chiều",
              name:
                schedule.title ||
                (schedule.type === "luot_di"
                  ? "Lượt đi buổi sáng"
                  : "Lượt về buổi chiều"),
              time: schedule.time?.substring(0, 5) || schedule.time,
              startTime: `Lộ trạm đầu tiên: ${
                schedule.time?.substring(0, 5) || schedule.time
              }`,
              school: schedule.endLocation || "Trường học",
              students: 0,
              type: schedule.type === "luot_di" ? "morning" : "afternoon",
              route: schedule.route || "",
              startLocation: schedule.startLocation || "",
              endLocation: schedule.endLocation || "",
              status: schedule.status || "chuabatdau",
              stops: schedule.stops || [],
              coordinates: coordinates,
              stations: stations,
            },
          ];
        });
      }
    },
    (data) => {
      // Khi lịch bị xóa: cập nhật real-time không cần reload
      console.log("🗑️ Schedule delete notification:", data);

      const scheduleId = data.scheduleId;
      setAssignedRoutes((prevRoutes) =>
        prevRoutes.filter((route) => route.id !== scheduleId)
      );
    }
  );

  // Join tracking room and listen for real-time bus location updates
  useEffect(() => {
    const driverId = user.id || user.driver_code;
    if (!driverId) return;

    // Initialize socket and join tracking room
    TrackingService.initSocket();
    TrackingService.joinTrackingRoom("driver", driverId);

    // Listen for bus location updates
    TrackingService.onBusLocationUpdate((data) => {
      console.log("📍 Bus location update:", data);
      setBusLocation(data.location);
      setTripProgress({
        percentage: data.progressPercentage || 0,
        distanceCovered: data.distanceCovered || 0,
        currentStop: data.currentStop || null,
      });
    });

    // Listen for trip completion
    TrackingService.onRouteCompleted((data) => {
      console.log("✅ Route completed:", data);
      // Auto-end trip when route completes
      handleEndTrip();
    });

    // Cleanup on unmount
    return () => {
      TrackingService.leaveTrackingRoom("driver", driverId);
    };
  }, [user.id, user.driver_code]);

  const handleStartTrip = async (route) => {
    try {
      // Call tracking API to start trip and simulator
      await TrackingService.startTrip(route.id);

      // 🚌 Fetch route đi qua TẤT CẢ các trạm (waypoints)
      const path = await fetchRouteFromOSRM(route.coordinates);
      setRoutePath(path);
      if (path.length > 0) {
        setBusPos(path[0]);
      }

      // Update local state
      setActiveTrip(route);
      setTripStarted(true);
      setSelectedStation(0);
    } catch (error) {
      console.error("Error starting trip:", error);
      alert("Không thể bắt đầu chuyến đi. Vui lòng thử lại.");
    }
  };

  /**
   * 🚌 Fetch route từ OSRM đi qua TẤT CẢ các trạm (waypoints)
   * @param {Array} coordinates - Array tất cả tọa độ: [[lat, lng], [lat, lng], ...]
   * @returns {Array} Route coordinates từ OSRM
   */
  const fetchRouteFromOSRM = async (coordinates) => {
    if (!coordinates || coordinates.length < 2) {
      console.warn("Invalid coordinates for OSRM");
      return [];
    }

    // Tạo URL với tất cả waypoints
    // Format: /driving/lng,lat;lng,lat;lng,lat?overview=full&geometries=geojson
    const waypointsStr = coordinates
      .map((coord) => `${coord[1]},${coord[0]}`) // [lat,lng] → lng,lat
      .join(";");

    const url = `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson`;

    console.log("📍 Fetching OSRM route with waypoints:", coordinates.length);

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!json.routes) {
        console.warn("No route found from OSRM");
        return [];
      }

      const coords = json.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);

      console.log("✅ OSRM route fetched:", coords.length, "coordinates");
      return coords;
    } catch (error) {
      console.error("Error fetching OSRM route:", error);
      return [];
    }
  };

  const handleEndTrip = async () => {
    try {
      // Call tracking API to end trip
      if (activeTrip) {
        await TrackingService.endTrip(activeTrip.id);
      }

      // Update local state
      setTripStarted(false);
      setActiveTrip(null);
      setSelectedStation(0);
      // Clear trip state from sessionStorage
      sessionStorage.removeItem("tripStarted");
      sessionStorage.removeItem("activeTrip");
      sessionStorage.removeItem("selectedStation");
    } catch (error) {
      console.error("Error ending trip:", error);
      alert("Không thể kết thúc chuyến đi. Vui lòng thử lại.");
    }
  };

  /**
   * ⚡ Gửi vị trí xe bus từ dashboard tài xế tới backend
   * - Gửi qua WebSocket (real-time cho phụ huynh)
   * - Lưu vào Backend API (lưu vào database)
   */
  useEffect(() => {
    if (!tripStarted || !busLocation || !activeTrip) return;

    // Tính tiến độ dựa trên vị trí hiện tại
    let progressPercentage = tripProgress.percentage;
    let distanceCovered = tripProgress.distanceCovered;

    // 🚨 Gửi vị trí tới backend mỗi 200ms (khớp với animation tốc độ)
    // để parent nhận được update mượt mà, không bị "giật"
    const sendInterval = setInterval(() => {
      if (busLocation) {
        const locationData = {
          latitude: busLocation.latitude,
          longitude: busLocation.longitude,
          scheduleId: activeTrip.id,
          driverId: user.id || user.driver_code,
          progressPercentage,
          distanceCovered,
        };

        // 1️⃣ Gửi qua WebSocket (real-time cho phụ huynh)
        TrackingService.sendBusLocation(locationData);

        // 2️⃣ Lưu vào Backend API (lưu vào database) - mỗi 2 giây (10 frames)
        // để không quá tải database
        if (Math.floor(Date.now() / 2000) % 10 === 0) {
          TrackingService.saveDriverLocationToBackend(locationData);
        }

        console.log("📤 Sent bus location (WebSocket):", {
          latitude: busLocation.latitude,
          longitude: busLocation.longitude,
        });
      }
    }, 200); // Gửi mỗi 200ms - khớp với animation frame rate

    return () => clearInterval(sendInterval);
  }, [
    tripStarted,
    busLocation,
    activeTrip,
    tripProgress,
    user.id,
    user.driver_code,
  ]);

  /**
   * 🚌 Animation: Xe bus chạy dọc theo route (giống admin dashboard)
   */
  useEffect(() => {
    if (!tripStarted || routePath.length === 0) return;

    let index = 0;

    const interval = setInterval(() => {
      index++;
      if (index >= routePath.length) index = 0;

      const currentPos = routePath[index];
      setBusPos(currentPos);

      // Cập nhật busLocation để gửi tới backend
      setBusLocation({
        latitude: currentPos[0],
        longitude: currentPos[1],
      });

      // Tính tiến độ dựa trên index
      const percentage = (index / Math.max(routePath.length - 1, 1)) * 100;
      const distance = index * 0.1; // Ước tính khoảng cách

      setTripProgress({
        percentage,
        distanceCovered: distance,
        currentStop: null,
      });

      console.log("🚌 Bus moving:", {
        position: currentPos,
        progress: percentage.toFixed(1) + "%",
        index,
      });
    }, 200); // Mỗi 200ms - tốc độ animation

    return () => clearInterval(interval);
  }, [tripStarted, routePath]);

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
              <h4>{activeTrip.name}</h4>
              <p className="trip-status-badge active">Đang đi chuyến</p>
            </div>
          </div>

          <div className="trip-info-card">
            <div className="card-icon-trip">📍</div>
            <div className="card-content">
              <h4>
                {activeTrip.startLocation} ➜ {activeTrip.endLocation}
              </h4>
              <p className="trip-time">Bắt đầu: {activeTrip.time}</p>
            </div>
          </div>

          {/* Trip Progress Card */}
          <div className="trip-info-card">
            <div className="card-icon-trip">📊</div>
            <div className="card-content">
              <h4>Tiến độ chuyến đi</h4>
              <p className="trip-progress">
                {tripProgress.percentage.toFixed(1)}% •{" "}
                {tripProgress.distanceCovered?.toFixed(2) || 0} km
              </p>
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

                {/* Draw actual road routing connecting all stops */}
                <RoutingPolyline
                  waypoints={activeTrip.coordinates}
                  color="#3b82f6"
                />

                {/* Draw markers for all stops with info */}
                {activeTrip.coordinates.map((coord, index) => {
                  const station = activeTrip.stations[index];
                  const isStart = index === 0;
                  const isEnd = index === activeTrip.stations.length - 1;
                  const color = isStart
                    ? "#10b981"
                    : isEnd
                    ? "#ef4444"
                    : "#f59e0b";

                  return (
                    <Marker key={index} position={coord} title={station?.name}>
                      <Popup>
                        <div>
                          <strong>
                            {station?.name || `Trạm ${index + 1}`}
                          </strong>
                          <br />
                          {station?.address && (
                            <>
                              <span style={{ fontSize: "12px" }}>
                                {station.address}
                              </span>
                              <br />
                            </>
                          )}
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "bold",
                              color: color,
                            }}
                          >
                            {isStart
                              ? "🟢 Điểm đầu"
                              : isEnd
                              ? "🔴 Điểm cuối"
                              : "🟡 Trạm dừng"}
                          </span>
                          <br />
                          {station?.time && (
                            <span style={{ fontSize: "12px" }}>
                              {station.time}
                            </span>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Current bus location marker - với icon xe bus */}
                {busPos && (
                  <Marker
                    position={busPos}
                    icon={busIcon}
                    title="Vị trí xe bus hiện tại"
                  >
                    <Popup>
                      <div style={{ textAlign: "center" }}>
                        <strong>🚌 Vị trí xe bus</strong>
                        <br />
                        <span style={{ fontSize: "12px" }}>
                          Lat: {busPos[0].toFixed(6)}
                        </span>
                        <br />
                        <span style={{ fontSize: "12px" }}>
                          Lon: {busPos[1].toFixed(6)}
                        </span>
                        <br />
                        <span style={{ fontSize: "12px", color: "#3b82f6" }}>
                          📊 Tiến độ: {tripProgress.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )}
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
                Tài xế:{" "}
                {user.ho_ten ||
                  user.ten_tai_xe ||
                  user.name ||
                  "Không xác định"}
              </button>
              <div style={{ marginTop: "12px" }}>
                <span className="search-label">
                  Trạm hiện tại:
                  <br />
                  {activeTrip.stations[selectedStation]?.name || "..."}
                </span>
                {busLocation && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      color: "#3b82f6",
                    }}
                  >
                    <strong>
                      📊 Tiến độ: {tripProgress.percentage.toFixed(1)}%
                    </strong>
                    <br />
                    <span>
                      Đã đi: {tripProgress.distanceCovered?.toFixed(2) || 0} km
                    </span>
                  </div>
                )}
              </div>
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

            {loading ? (
              <div
                className="loading-container"
                style={{ padding: "40px", textAlign: "center" }}
              >
                <p>Đang tải lịch trình...</p>
              </div>
            ) : error ? (
              <div
                className="error-container"
                style={{ padding: "20px", color: "red", textAlign: "center" }}
              >
                <p>{error}</p>
              </div>
            ) : assignedRoutes.length === 0 ? (
              <div
                className="no-data-container"
                style={{ padding: "40px", textAlign: "center", color: "#999" }}
              >
                <p>Hôm nay không có chuyến đi được phân công</p>
              </div>
            ) : (
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
                        <strong>Thời gian đầu tiên:</strong> {route.startTime}.
                        Lộ trạm: đến xe ⇨ {route.school}
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
            )}
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
                    {/* Draw actual road routing connecting all stops */}
                    <RoutingPolyline
                      waypoints={route.coordinates}
                      color={route.type === "morning" ? "#3b82f6" : "#f59e0b"}
                    />

                    {/* Draw markers for all stops */}
                    {route.stations &&
                      route.stations.map((station, index) => {
                        const isStart = index === 0;
                        const isEnd = index === route.stations.length - 1;
                        const color = isStart
                          ? "#10b981"
                          : isEnd
                          ? "#ef4444"
                          : "#f59e0b";

                        return (
                          <Marker
                            key={station.id}
                            position={route.coordinates[index]}
                            title={station.name}
                          >
                            <Popup>
                              <div>
                                <strong>{station.name}</strong>
                                <br />
                                <span style={{ fontSize: "12px" }}>
                                  {station.address}
                                </span>
                                <br />
                                <span
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    color: color,
                                  }}
                                >
                                  {isStart
                                    ? "🟢 Điểm đầu"
                                    : isEnd
                                    ? "🔴 Điểm cuối"
                                    : "🟡 Trạm dừng"}
                                </span>
                                <br />
                                {station.time && (
                                  <span style={{ fontSize: "12px" }}>
                                    {station.time}
                                  </span>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
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
        <Header title="Tài xế" showSearch={false} />
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
