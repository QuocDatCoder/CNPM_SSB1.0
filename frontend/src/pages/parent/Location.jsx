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
import "./Location.css";
import ParentTrackingService from "../../services/parent-tracking.service";
import ScheduleService from "../../services/schedule.service";

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
  onError: () => {
    console.warn("❌ busmap.png failed to load, using fallback");
  },
});

// Icon start/end/stop
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

// Component để vẽ routing thực tế giữa các điểm
const RoutingPolyline = ({ waypoints, color = "#3b82f6" }) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const fallbackPolylineRef = useRef(null);

  useEffect(() => {
    if (!map || !waypoints || waypoints.length < 2) return;

    // 🗑️ Clean up old routing control/polyline completely
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
        console.warn("Error removing routing control:", e);
      }
      routingControlRef.current = null;
    }

    if (fallbackPolylineRef.current) {
      try {
        map.removeLayer(fallbackPolylineRef.current);
      } catch (e) {
        console.warn("Error removing fallback polyline:", e);
      }
      fallbackPolylineRef.current = null;
    }

    try {
      // 📍 Use L.Routing.control to get actual street routing
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
        fitSelectedRoutes: false,
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
        }),
      });

      // Add error handler to prevent console errors from pending requests
      routingControlRef.current.on("routingerror", (err) => {
        console.warn("🚨 Routing error (safe):", err);
      });

      // Patch the routing control to handle destroyed maps safely
      const originalAddTo = routingControlRef.current.addTo.bind(
        routingControlRef.current
      );
      routingControlRef.current.addTo = function (map) {
        try {
          if (!map || !map._container) {
            console.warn("⚠️ Map container not available, skipping addTo");
            return this;
          }
          return originalAddTo(map);
        } catch (e) {
          console.warn("Error in patched addTo:", e);
          return this;
        }
      };

      routingControlRef.current.addTo(map);
      console.log(`✅ Routing control added for color ${color}`);
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
        console.log(`✅ Fallback polyline added for color ${color}`);
      }
    }

    return () => {
      if (routingControlRef.current) {
        try {
          // Prevent errors from pending OSRM requests
          if (routingControlRef.current._router) {
            routingControlRef.current._router._abortRequest?.();
          }
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (e) {}
      }
      if (fallbackPolylineRef.current) {
        try {
          map.removeLayer(fallbackPolylineRef.current);
          fallbackPolylineRef.current = null;
        } catch (e) {}
      }
    };
  }, [waypoints, map, color]);

  return null;
};

// Custom component để lưu map ref
function MapController({ mapRefCallback }) {
  const map = useMap();

  useEffect(() => {
    mapRefCallback.current = map;
  }, [map, mapRefCallback]);

  return null;
}

function Location({ initialShift = null }) {
  const mapRef = useRef(null);
  const [busLocation, setBusLocation] = useState(null);
  const [markerKey, setMarkerKey] = useState(0); // Force re-render marker
  const lastLocationRef = useRef(null); // Để tránh duplicate updates
  const [tripProgress, setTripProgress] = useState({
    percentage: 0,
    distanceCovered: 0,
    distanceRemaining: 0,
  });
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [routePath, setRoutePath] = useState([]);
  const [stations, setStations] = useState([]);
  const [studentInfo, setStudentInfo] = useState({
    name: "Chờ thông tin",
    class: "Chờ thông tin",
  });

  const [tripInfo, setTripInfo] = useState({
    driver: "Chờ thông tin",
    driverPhone: "Chờ thông tin",
    busNumber: "Chờ thông tin",
    busType: "Chờ thông tin",
    status: "Chờ khởi hành",
    statusColor: "#9ca3af",
    tripType: "Chờ thông tin",
    distance: "-- km",
  });

  // 🔄 State để chọn lượt đi hoặc về
  const [selectedShift, setSelectedShift] = useState(initialShift || "morning"); // "morning" hoặc "afternoon"
  const [allTrips, setAllTrips] = useState([]); // Lưu tất cả chuyến của con

  // 📢 Notification state for real-time student status changes (Moved to ParentDashboard)
  // const [notification, setNotification] = useState(null);
  // const notificationTimeoutRef = useRef(null);
  const [studentStatusMap, setStudentStatusMap] = useState({}); // Lưu trạng thái học sinh

  // 👶 Get all student IDs of current parent (for filtering in local listener)
  const [myStudentIds, setMyStudentIds] = useState([]); // Danh sách tất cả học sinh con của phụ huynh này

  // Fetch kids data to get student IDs for filtering
  useEffect(() => {
    const fetchKidsTrips = async () => {
      try {
        const response = await ScheduleService.getMyKidsTrips();
        if (response && Array.isArray(response)) {
          const studentIds = response.map((kid) => kid.student_id);
          console.log(`👶 Location.jsx - My student IDs:`, studentIds);
          setMyStudentIds(studentIds);
        }
      } catch (err) {
        console.error("Error fetching kids data:", err);
      }
    };

    fetchKidsTrips();
  }, []);

  // ⚡ Bỏ effect animation không cần - dùng busLocation trực tiếp

  // Auto-fit map để hiển thị toàn bộ route và trạm
  useEffect(() => {
    if (routePath.length > 0 && mapRef.current) {
      const map = mapRef.current;
      const bounds = L.latLngBounds(routePath);

      // Add padding để markers không sát edge
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [routePath]);

  // Keep myStudentIds in ref for use in listeners without causing re-registration
  const myStudentIdsRef = useRef([]);

  useEffect(() => {
    myStudentIdsRef.current = myStudentIds;
  }, [myStudentIds]);

  // 🚨 DEBUG: Log busLocation mỗi khi nó thay đổi
  useEffect(() => {
    if (busLocation) {
      console.log("🎯 busLocation state updated to:", busLocation);
    }
  }, [busLocation]);

  // 🔇 Suppress leaflet-routing-machine errors from pending requests
  useEffect(() => {
    const originalError = window.console.error;
    const errorFilter = function (...args) {
      const errorMsg = args[0]?.toString() || "";
      // Suppress known leaflet-routing-machine errors
      if (
        errorMsg.includes("Cannot read properties of null") &&
        errorMsg.includes("removeLayer")
      ) {
        console.log(
          "⚠️ Suppressed leaflet-routing-machine error (safe to ignore)"
        );
        return;
      }
      originalError.apply(console, args);
    };

    // Also catch uncaught errors globally
    const handleUncaughtError = (event) => {
      const errorMsg = event.message || "";
      if (
        errorMsg.includes("Cannot read properties of null") &&
        errorMsg.includes("removeLayer")
      ) {
        console.log(
          "⚠️ Caught and suppressed leaflet-routing-machine error (safe)"
        );
        event.preventDefault();
        return true;
      }
    };

    window.console.error = errorFilter;
    window.addEventListener("error", handleUncaughtError);

    return () => {
      window.console.error = originalError;
      window.removeEventListener("error", handleUncaughtError);
    };
  }, []);

  // Đăng ký listener WebSocket một lần khi component mount
  useEffect(() => {
    ParentTrackingService.initSocket();
    ParentTrackingService.joinParentTracking();

    // 📍 Listener cho cập nhật vị trí xe
    const handleBusLocationUpdate = (data) => {
      console.log("🚌 Received bus location update:", data);

      if (data.location) {
        const newLat = data.location.latitude;
        const newLng = data.location.longitude;

        console.log(
          `📍 Location coords: ${newLat}, ${newLng}, scheduleId: ${data.scheduleId}`
        );
        console.log(
          `📍 Last location: ${lastLocationRef.current?.latitude}, ${lastLocationRef.current?.longitude}`
        );

        // 🚨 Luôn update position (không skip để marker move smooth)
        if (
          !lastLocationRef.current ||
          lastLocationRef.current.latitude !== newLat ||
          lastLocationRef.current.longitude !== newLng
        ) {
          console.log(`✅ Updating marker position to ${newLat}, ${newLng}`);
          lastLocationRef.current = { latitude: newLat, longitude: newLng };

          // Set new location object
          setBusLocation({
            latitude: newLat,
            longitude: newLng,
          });

          // Force marker re-render by changing key
          setMarkerKey((prev) => prev + 1);

          console.log(`🎯 State updated - marker should move now`);
        } else {
          console.log(`⏸️ Location hasn't changed, skipping update`);
        }
      }

      if (data.progressPercentage !== undefined) {
        setTripProgress({
          percentage: data.progressPercentage,
          distanceCovered: data.distanceCovered || 0,
          distanceRemaining: data.distanceRemaining || 0,
        });
      }

      if (data.driverId) {
        setTripInfo((prev) => ({
          ...prev,
          status: "Đang chạy",
          statusColor: "#10b981",
        }));
      }

      setIsTrackingActive(true);
    };

    // ✅ Listener cho hoàn thành chuyến
    const handleRouteCompleted = (data) => {
      console.log("✅ Route completed:", data);
      setTripInfo((prev) => ({
        ...prev,
        status: "Hoàn thành",
        statusColor: "#10b981",
      }));
      setIsTrackingActive(false);
    };

    // 📢 Listener cho thay đổi trạng thái học sinh (ONLY update status map, NOT notification)
    // Notification is handled globally by ParentDashboard
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
        `📢 Location.jsx - Student status changed: ${studentName} -> ${statusLabel}, studentId: ${studentId}, myStudentIds: ${myStudentIdsRef.current}`
      );

      // 🔒 Chỉ cập nhật nếu học sinh là con của phụ huynh này
      if (!myStudentIdsRef.current.includes(studentId)) {
        console.log(
          `⏭️ Location.jsx - Ignoring update - student ${studentId} không phải con của phụ huynh này`
        );
        return;
      }

      // 1️⃣ Cập nhật ONLY status map (để Location component hiển thị status mới trên map)
      setStudentStatusMap((prev) => ({
        ...prev,
        [scheduleStudentId]: newStatus,
      }));

      console.log(
        `✅ Location.jsx - Student status map updated for ${scheduleStudentId}`
      );
    };

    console.log("📍 Location.jsx: Registering location and status listeners");
    ParentTrackingService.socket?.on(
      "bus-location-update",
      handleBusLocationUpdate
    );
    ParentTrackingService.socket?.on("route-completed", handleRouteCompleted);
    ParentTrackingService.socket?.on(
      "student-status-changed",
      handleStudentStatusChanged
    );

    // Cleanup: xóa listener khi component unmount
    return () => {
      console.log(
        "📍 Location.jsx: Unregistering location and status listeners"
      );
      ParentTrackingService.socket?.off(
        "bus-location-update",
        handleBusLocationUpdate
      );
      ParentTrackingService.socket?.off(
        "route-completed",
        handleRouteCompleted
      );
      ParentTrackingService.socket?.off(
        "student-status-changed",
        handleStudentStatusChanged
      );
      // DO NOT call leaveParentTracking here - keep the parent-tracking room active
      // for other pages to receive notifications
    };
  }, []); // Empty dependency array - register once and never re-register

  // 🔄 Fetch tất cả chuyến
  useEffect(() => {
    const fetchParentSchedules = async () => {
      try {
        console.log("🔄 Fetching parent schedules...");
        const response = await ScheduleService.getMyKidsTrips();
        console.log("📅 Parent schedules full response:", response);

        if (response && Array.isArray(response) && response.length > 0) {
          const kid = response[0];
          console.log("👶 Selected kid:", kid);

          setStudentInfo({
            name: kid.ten_con || "Chờ thông tin",
            class: kid.lop || "Chờ thông tin",
          });

          // Lưu tất cả chuyến
          if (
            kid.danh_sach_chuyen &&
            Array.isArray(kid.danh_sach_chuyen) &&
            kid.danh_sach_chuyen.length > 0
          ) {
            setAllTrips(kid.danh_sach_chuyen);
            console.log("📋 All trips saved:", kid.danh_sach_chuyen);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching parent schedules:", error);
      }
    };

    fetchParentSchedules();
  }, []);

  // 🗑️ Force clear ALL routing controls before new route loads
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // First, abort any pending routing requests to prevent errors
    document.querySelectorAll(".leaflet-routing-container").forEach((el) => {
      try {
        // Try to abort any pending XMLHttpRequest in the routing control
        if (el.__proto__?.removeLayer === null) {
          console.warn("⚠️ Routing control already destroyed, skipping");
        }
      } catch (e) {}
    });

    // Remove all leaflet-routing-container from DOM
    document.querySelectorAll(".leaflet-routing-container").forEach((el) => {
      try {
        el.remove();
      } catch (e) {}
    });

    // Remove all routing-related controls from map._controls
    if (map._controls) {
      map._controls.slice().forEach((control) => {
        try {
          if (control._routing_control || control.options?.routing) {
            // Abort pending requests before removing
            if (control._router && control._router._abortRequest) {
              control._router._abortRequest();
            }
            map.removeControl(control);
          }
        } catch (e) {}
      });
    }

    // Remove any routing-related DOM elements
    document.querySelectorAll("[class*='routing']").forEach((el) => {
      if (
        el.classList.contains("leaflet-routing-container") ||
        el.classList.contains("leaflet-routing-instruction")
      ) {
        try {
          el.remove();
        } catch (e) {}
      }
    });

    console.log(`🗑️ Fully cleared routing for shift: ${selectedShift}`);
  }, [selectedShift, mapRef]);

  // 🔄 Update route khi selectedShift thay đổi
  useEffect(() => {
    const loadRouteForShift = async () => {
      if (allTrips.length === 0) return;

      // 🗑️ Clear old route immediately
      setRoutePath([]);
      setStations([]);

      // Tìm chuyến theo shift (morning="Lượt đi", afternoon="Lượt về")
      const trip = allTrips.find((t) => {
        const isLuotDi =
          t.loai_chuyen?.includes("Đón") || t.loai_chuyen?.includes("đi");
        return selectedShift === "morning" ? isLuotDi : !isLuotDi;
      });

      if (!trip) {
        console.warn(`❌ No trip found for shift: ${selectedShift}`);
        return;
      }

      console.log(`📍 Loading route for ${selectedShift}:`, trip);

      // Fetch route stops
      let stops = [];
      if (trip.route_id) {
        try {
          console.log(`🔍 Fetching stops for route ${trip.route_id}...`);
          stops = await ScheduleService.getRouteStops(trip.route_id);
          console.log("✅ Route stops fetched:", stops);
        } catch (err) {
          console.warn(
            "⚠️ Could not fetch route stops, using dummy stops:",
            err
          );
        }
      }

      // Fallback dummy stops
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
      console.log("✅ Coordinates extracted:", coordinates);
      setRoutePath(coordinates);
      setStations(stops);

      // Update trip info
      setTripInfo((prev) => ({
        ...prev,
        driver: trip.tai_xe || "Chờ thông tin",
        driverPhone: trip.sdt_tai_xe || "Chờ thông tin",
        busNumber: trip.bien_so_xe || "Chờ thông tin",
        busType: trip.hang_xe || "Chờ thông tin",
        tripType: trip.loai_chuyen || "Chờ thông tin",
        distance: trip.khoang_cach || "-- km",
        status:
          trip.trang_thai_chuyen === "chuabatdau"
            ? "Chưa khởi hành"
            : trip.trang_thai_chuyen === "dangchay"
            ? "Đang chạy"
            : trip.trang_thai_chuyen === "hoanthanh"
            ? "Hoàn thành"
            : "Chờ thông tin",
      }));
    };

    loadRouteForShift();
  }, [selectedShift, allTrips]);

  return (
    <div className="parent-location-page">
      <div className="parent-location-container">
        <div className="parent-location-sidebar">
          <div className="parent-location-student-card">
            <div className="parent-location-student-avatar">
              <img src="/image/avatar2.png" alt="Student" />
            </div>
            <div className="parent-location-student-info">
              <h3>{studentInfo.name}</h3>
              <p>{studentInfo.class}</p>
            </div>
          </div>

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

          {/* 🔄 Shift Selector */}
          {allTrips.length > 1 && (
            <div style={{ marginBottom: "15px" }}>
              <h4
                style={{
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Chọn lượt:
              </h4>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setSelectedShift("morning")}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor:
                      selectedShift === "morning" ? "#3b82f6" : "#e5e7eb",
                    color: selectedShift === "morning" ? "white" : "#374151",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "13px",
                    transition: "all 0.2s",
                  }}
                >
                  🌅 Lượt Đi
                </button>
                <button
                  onClick={() => setSelectedShift("afternoon")}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor:
                      selectedShift === "afternoon" ? "#f59e0b" : "#e5e7eb",
                    color: selectedShift === "afternoon" ? "white" : "#374151",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "13px",
                    transition: "all 0.2s",
                  }}
                >
                  🌆 Lượt Về
                </button>
              </div>
            </div>
          )}

          <div className="parent-location-trip-info">
            <h4>Thông tin chuyến đi</h4>

            <div className="parent-location-info-row">
              <span className="parent-location-label">Loại chuyến:</span>
              <span className="parent-location-value">{tripInfo.tripType}</span>
            </div>

            <div className="parent-location-info-row">
              <span className="parent-location-label">Tài xế:</span>
              <span className="parent-location-value">{tripInfo.driver}</span>
            </div>

            <div className="parent-location-info-row">
              <span className="parent-location-label">SĐT Tài xế:</span>
              <span className="parent-location-value">
                {tripInfo.driverPhone}
              </span>
            </div>

            <div className="parent-location-info-row">
              <span className="parent-location-label">Biển số xe:</span>
              <span className="parent-location-value">
                {tripInfo.busNumber}
              </span>
            </div>

            <div className="parent-location-info-row">
              <span className="parent-location-label">Hãng xe:</span>
              <span className="parent-location-value">{tripInfo.busType}</span>
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

            {isTrackingActive && (
              <>
                <div className="parent-location-info-row">
                  <span className="parent-location-label">Tiến độ:</span>
                  <span className="parent-location-value">
                    {tripProgress.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="parent-location-progress-bar">
                  <div
                    className="parent-location-progress-fill"
                    style={{ width: `${tripProgress.percentage}%` }}
                  ></div>
                </div>
                <div className="parent-location-info-row">
                  <span className="parent-location-label">Quãng đường:</span>
                  <span className="parent-location-value">
                    {tripProgress.distanceCovered.toFixed(2)} /{" "}
                    {(
                      tripProgress.distanceCovered +
                      tripProgress.distanceRemaining
                    ).toFixed(2)}{" "}
                    km
                  </span>
                </div>
              </>
            )}

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
                <span className="parent-location-stat-label">Khoảng cách</span>
                <span className="parent-location-stat-value">
                  {tripInfo.distance}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="parent-location-map-panel">
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

          <div className="parent-location-map-container">
            <MapContainer
              center={routePath.length > 0 ? routePath[0] : [21.0555, 105.8142]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <MapController mapRefCallback={mapRef} />

              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {routePath.length > 1 && (
                <RoutingPolyline
                  key={selectedShift}
                  waypoints={routePath}
                  color="#3b82f6"
                />
              )}

              {stations.map((station, index) => {
                let icon = stopIcon;
                let label = station.ten_diem || `Trạm ${index + 1}`;

                if (index === 0) {
                  icon = startIcon;
                  label = station.ten_diem || "Điểm khởi hành";
                } else if (index === stations.length - 1) {
                  icon = endIcon;
                  label = station.ten_diem || "Trường học";
                }

                return (
                  <Marker
                    key={station.id}
                    position={[station.latitude, station.longitude]}
                    icon={icon}
                  >
                    <Popup>
                      <div>
                        <strong>{label}</strong>
                        <br />
                        {station.dia_chi || station.address}
                        <br />
                        <small>
                          {station.ghi_chu && `Ghi chú: ${station.ghi_chu}`}
                        </small>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {busLocation && (
                <>
                  {console.log("🚌 Rendering bus marker at:", busLocation)}
                  <Marker
                    key={`bus-marker-${markerKey}`}
                    position={[busLocation.latitude, busLocation.longitude]}
                    icon={busIcon}
                  >
                    <Popup>
                      <div style={{ textAlign: "center" }}>
                        <strong>🚌 Vị trí xe bus</strong>
                        <br />
                        <small>
                          {busLocation.latitude.toFixed(5)},{" "}
                          {busLocation.longitude.toFixed(5)}
                        </small>
                        <br />
                        <small>
                          Tiến độ: {tripProgress.percentage.toFixed(1)}%
                        </small>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>

            <div className="parent-location-map-controls">
              <button className="parent-location-zoom-btn">+</button>
              <button className="parent-location-zoom-btn">-</button>
            </div>

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
