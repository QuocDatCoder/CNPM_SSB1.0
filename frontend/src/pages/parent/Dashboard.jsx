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
import "../../../node_modules/leaflet-routing-machine/dist/leaflet-routing-machine.css";
import Sidebar from "../../components/common/Sidebar/Sidebar";
import Header from "../../components/common/Header/header";
import Location from "./Location";
import Notifications from "./Notifications";
import ScheduleService from "../../services/schedule.service";
import ParentTrackingService from "../../services/parent-tracking.service";
import "./Dashboard.css";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
});

// Custom icons cho map
const startIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const endIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const stopIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component để vẽ routing
const RoutingPolyline = ({ waypoints, color = "#3b82f6" }) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const fallbackPolylineRef = useRef(null);

  useEffect(() => {
    if (!map || !waypoints || waypoints.length < 2) return;

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
        show: false,
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
        } catch (e) {}
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

// Component để fit bounds
function MapController({ mapRefCallback, bounds }) {
  const map = useMap();

  useEffect(() => {
    mapRefCallback.current = map;
    if (bounds && bounds.length > 0) {
      const latLngs = L.latLngBounds(bounds);
      map.fitBounds(latLngs, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, mapRefCallback, bounds]);

  return null;
}

function ParentDashboard() {
  const mapRef = useRef(null);
  const [activePage, setActivePage] = useState("Trang chủ");
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [stations, setStations] = useState([]);

  // 🔄 Track trip status updates for real-time refresh
  const [tripStatusUpdate, setTripStatusUpdate] = useState(0);

  // 📢 Notification state for real-time student status changes (Global)
  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);

  // 🚨 Approaching-stop notification state (yellow badge)
  const [approachingStopNotification, setApproachingStopNotification] =
    useState(null);
  const approachingStopTimeoutRef = useRef(null);

  // 📡 Initialize socket connection and join parent tracking room
  useEffect(() => {
    ParentTrackingService.initSocket();
    ParentTrackingService.joinParentTracking();
    console.log("📡 Parent Dashboard socket initialized");
  }, []);

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

        // Fetch route stops từ trip đầu tiên
        if (response && response.length > 0) {
          const kid = response[0];
          if (
            kid.danh_sach_chuyen &&
            Array.isArray(kid.danh_sach_chuyen) &&
            kid.danh_sach_chuyen.length > 0
          ) {
            const trip = kid.danh_sach_chuyen[0];
            console.log("📍 Trip data:", trip);

            // Fetch actual route stops
            let stops = [];
            if (trip.route_id) {
              try {
                console.log(`🔍 Fetching stops for route ${trip.route_id}...`);
                stops = await ScheduleService.getRouteStops(trip.route_id);
                console.log("✅ Route stops fetched:", stops);
              } catch (err) {
                console.warn("⚠️ Could not fetch route stops:", err);
              }
            }

            // If no stops, use dummy stops
            if (!stops || stops.length === 0) {
              console.log("📌 Using dummy stops as fallback");
              stops = [
                {
                  id: 1,
                  ten_diem: "Điểm khởi hành",
                  dia_chi: trip.diem_dung || "Chờ thông tin",
                  latitude: 10.7769,
                  longitude: 106.6869,
                },
                {
                  id: 2,
                  ten_diem: "Trạm trung gian",
                  dia_chi: "Đường Võ Văn Kiệt",
                  latitude: 10.758,
                  longitude: 106.6966,
                },
                {
                  id: 3,
                  ten_diem: "Trường học",
                  dia_chi: "Vinschool",
                  latitude: 10.7438,
                  longitude: 106.7295,
                },
              ];
            }

            const coordinates = stops.map((stop) => [
              parseFloat(stop.latitude),
              parseFloat(stop.longitude),
            ]);
            setRoutePath(coordinates);
            setStations(stops);
          }
        }
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

  // 🔄 Listen for trip status updates from socket
  useEffect(() => {
    const handleTripStatusChanged = (data) => {
      console.log(`🔄 Trip status changed:`, data);
      // Trigger re-fetch of kids data to get updated status
      setTripStatusUpdate((prev) => prev + 1);
    };

    ParentTrackingService.socket?.on(
      "trip-status-changed",
      handleTripStatusChanged
    );

    return () => {
      ParentTrackingService.socket?.off(
        "trip-status-changed",
        handleTripStatusChanged
      );
    };
  }, []);

  // 🔄 Re-fetch kids data when trip status updates
  useEffect(() => {
    if (tripStatusUpdate === 0) return; // Skip initial render

    const refetchKidsTrips = async () => {
      try {
        const response = await ScheduleService.getMyKidsTrips();
        setKids(response || []);
        console.log(`✅ Kids data refreshed after trip status change`);
      } catch (err) {
        console.error("Error refetching kids trips:", err);
      }
    };

    refetchKidsTrips();
  }, [tripStatusUpdate]);

  // 📢 Get all student IDs of current parent
  const [myStudentIds, setMyStudentIds] = useState([]);
  const myStudentIdsRef = useRef([]);

  // Fetch kids data to get student IDs for notification filtering
  useEffect(() => {
    const fetchKidsTrips = async () => {
      try {
        const response = await ScheduleService.getMyKidsTrips();
        if (response && Array.isArray(response)) {
          const studentIds = response.map((kid) => kid.student_id);
          console.log(`👶 My student IDs fetched:`, studentIds);
          setMyStudentIds(studentIds);
          myStudentIdsRef.current = studentIds; // Keep ref in sync
        }
      } catch (err) {
        console.error("Error fetching kids data:", err);
      }
    };

    fetchKidsTrips();
  }, []);

  // Keep ref updated when state changes
  useEffect(() => {
    myStudentIdsRef.current = myStudentIds;
  }, [myStudentIds]);

  // 📢 Listen for student status change notifications (Global)
  useEffect(() => {
    const handleStudentStatusChanged = (data) => {
      const {
        scheduleStudentId,
        studentId,
        studentName,
        newStatus,
        statusLabel,
        timestamp,
      } = data;

      console.log(
        `📢 Student status changed: ${studentName} -> ${statusLabel}, studentId: ${studentId}, myStudentIds: ${myStudentIdsRef.current}`
      );

      // 🔒 Chỉ hiển thị notification nếu học sinh là con của phụ huynh này
      if (!myStudentIdsRef.current.includes(studentId)) {
        console.log(
          `⏭️ Ignoring notification - student ${studentId} không phải con của phụ huynh này`
        );
        return;
      }

      console.log(`✅ Showing notification for student ${studentId}`);

      // Hiển thị notification
      setNotification({
        studentName: studentName,
        statusLabel: statusLabel,
        timestamp: timestamp,
      });

      // Clear timeout cũ nếu có
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }

      // Set timeout mới để tự động ẩn sau 5 giây
      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, 5000);
    };

    console.log("📢 Registering student-status-changed listener");
    ParentTrackingService.socket?.on(
      "student-status-changed",
      handleStudentStatusChanged
    );

    return () => {
      console.log("📢 Unregistering student-status-changed listener");
      ParentTrackingService.socket?.off(
        "student-status-changed",
        handleStudentStatusChanged
      );
    };
  }, []); // Empty dependency array - register listener once

  // 🚨 Listen for approaching-stop notifications (yellow badge)
  useEffect(() => {
    const handleApproachingStop = (data) => {
      const {
        studentId,
        studentName,
        stopName,
        stopIndex,
        distanceToStop,
        scheduleId,
        timestamp,
      } = data;

      console.log(
        `🚨 Approaching stop: ${studentName} -> ${stopName} (${distanceToStop}m away), studentId: ${studentId}, myStudentIds: ${myStudentIdsRef.current}`
      );

      // 🔒 Chỉ hiển thị notification nếu học sinh là con của phụ huynh này
      // NOTE: Tạm thời bỏ qua nếu studentId là 0 (placeholder), sẽ fix khi backend có studentId thực
      if (studentId !== 0 && !myStudentIdsRef.current.includes(studentId)) {
        console.log(
          `⏭️ Ignoring approaching-stop - student ${studentId} không phải con của phụ huynh này`
        );
        return;
      }

      console.log(
        `✅ Showing approaching-stop notification for student ${studentId}`
      );

      // Hiển thị approaching-stop notification (vàng)
      setApproachingStopNotification({
        studentName: studentName,
        stopName: stopName,
        distanceToStop: distanceToStop,
        timestamp: timestamp,
      });

      // Clear timeout cũ nếu có
      if (approachingStopTimeoutRef.current) {
        clearTimeout(approachingStopTimeoutRef.current);
      }

      // Set timeout mới để tự động ẩn sau 7 giây (lâu hơn status change)
      approachingStopTimeoutRef.current = setTimeout(() => {
        setApproachingStopNotification(null);
      }, 7000);
    };

    console.log("🚨 Registering approaching-stop listener");
    ParentTrackingService.socket?.on("approaching-stop", handleApproachingStop);

    return () => {
      console.log("🚨 Unregistering approaching-stop listener");
      ParentTrackingService.socket?.off(
        "approaching-stop",
        handleApproachingStop
      );
    };
  }, []); // Empty dependency array - register listener once

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

  console.log("👶 Kids data:", kids);
  console.log("🚌 Transformed trips:", trips);
  console.log("🚌 Trips count:", trips.length);

  // Default center nếu không có dữ liệu route
  const defaultCenter =
    routePath.length > 0 ? routePath[0] : [10.7769, 106.6869];

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
                      {console.log(
                        "⚠️ No trips to display. kids:",
                        kids,
                        "trips:",
                        trips
                      )}
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
                            disabled={trip.status === "Hoàn thành"}
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
                      center={defaultCenter}
                      zoom={13}
                      style={{
                        height: "100%",
                        width: "100%",
                        borderRadius: "12px",
                      }}
                      zoomControl={false}
                    >
                      <MapController
                        mapRefCallback={mapRef}
                        bounds={routePath}
                      />

                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />

                      {routePath.length > 1 && (
                        <RoutingPolyline
                          waypoints={routePath}
                          color="#3b82f6"
                        />
                      )}

                      {stations.map((station, index) => {
                        let icon = stopIcon;
                        let label = `Trạm ${index + 1}`;

                        if (index === 0) {
                          icon = startIcon;
                          label = "Điểm khởi hành";
                        } else if (index === stations.length - 1) {
                          icon = endIcon;
                          label = "Trường học";
                        }

                        return (
                          <Marker
                            key={station.id}
                            position={[
                              parseFloat(station.latitude),
                              parseFloat(station.longitude),
                            ]}
                            icon={icon}
                          >
                            <Popup>
                              <div>
                                <strong>{label}</strong>
                                <br />
                                {station.ten_diem}
                                <br />
                                <small>{station.dia_chi}</small>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
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

      {/* 📢 Real-time Notification Badge (Global) */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#10b981",
            color: "white",
            padding: "16px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 9999,
            minWidth: "300px",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "4px" }}>
            ✅ Cập nhật trạng thái
          </div>
          <div style={{ fontSize: "14px" }}>
            <strong>{notification.studentName}</strong> đã{" "}
            {notification.statusLabel.toLowerCase()}
          </div>
          <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.8 }}>
            {new Date(notification.timestamp).toLocaleTimeString("vi-VN")}
          </div>

          <style>{`
            @keyframes slideIn {
              from {
                transform: translateX(400px);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

      {/* 🚨 Approaching-stop Notification Badge (Yellow) */}
      {approachingStopNotification && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#f59e0b",
            color: "#1f2937",
            padding: "16px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 9999,
            minWidth: "300px",
            animation: "slideIn 0.3s ease-out",
            border: "2px solid #d97706",
            marginTop: notification ? "100px" : "0px",
            transition: "margin-top 0.3s ease-out",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "4px" }}>
            🚍 Xe sắp đến trạm
          </div>
          <div style={{ fontSize: "14px" }}>
            <strong>{approachingStopNotification.studentName}</strong> - Xe sắp
            tới <strong>{approachingStopNotification.stopName}</strong>
          </div>
          <div style={{ fontSize: "13px", marginTop: "4px", opacity: 0.9 }}>
            Cách trạm:{" "}
            <strong>{approachingStopNotification.distanceToStop}m</strong>
          </div>
          <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>
            {new Date(approachingStopNotification.timestamp).toLocaleTimeString(
              "vi-VN"
            )}
          </div>

          <style>{`
            @keyframes slideIn {
              from {
                transform: translateX(400px);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default ParentDashboard;
