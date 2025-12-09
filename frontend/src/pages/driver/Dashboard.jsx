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
import StudentStopModal from "./StudentStopModal";
import "./Dashboard.css";
import drivers from "../../data/drivers";
import ScheduleService from "../../services/schedule.service";
import TrackingService from "../../services/tracking.service";
import StudentService from "../../services/student.service";
import StopService from "../../services/stop.service";
import useDriverScheduleSocket from "../../hooks/useDriverScheduleSocket";
import NotificationService from "../../services/notification.service";
import RouteService from "../../services/route.service";

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

// 🎨 Component vẽ đoạn đường với nhiều màu dựa trên tốc độ
const ColoredSpeedPolylines = ({ routePath, speedSegments }) => {
  const map = useMap();
  const polylinesRef = useRef([]);

  useEffect(() => {
    if (
      !map ||
      !routePath ||
      routePath.length < 2 ||
      !speedSegments ||
      speedSegments.length === 0
    ) {
      // Xóa tất cả polylines cũ
      polylinesRef.current.forEach((line) => {
        try {
          map.removeLayer(line);
        } catch (e) {}
      });
      polylinesRef.current = [];
      return;
    }

    // Xóa tất cả polylines cũ
    polylinesRef.current.forEach((line) => {
      try {
        map.removeLayer(line);
      } catch (e) {}
    });
    polylinesRef.current = [];

    // Vẽ polyline cho mỗi segment với màu khác nhau
    speedSegments.forEach((segment) => {
      const startIndex = Math.min(segment.start, routePath.length - 1);
      const endIndex = Math.min(segment.end, routePath.length - 1);

      // Lấy coordinates cho segment này
      const segmentCoords = routePath.slice(startIndex, endIndex + 1);

      if (segmentCoords.length >= 2) {
        const polyline = L.polyline(segmentCoords, {
          color: segment.color,
          opacity: 0.85,
          weight: 6,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        polylinesRef.current.push(polyline);

        console.log(
          `🎨 Vẽ polyline segment ${segment.label}: ${startIndex}-${endIndex} | Màu: ${segment.color}`
        );
      }
    });

    return () => {
      // Cleanup
      polylinesRef.current.forEach((line) => {
        try {
          map.removeLayer(line);
        } catch (e) {}
      });
      polylinesRef.current = [];
    };
  }, [routePath, speedSegments, map]);

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
  const [showStudentModal, setShowStudentModal] = useState(false); // Modal học sinh
  const [stopsData, setStopsData] = useState([]); // Dữ liệu trạm + học sinh
  const [loadingStops, setLoadingStops] = useState(false);
  const [currentNearbyStop, setCurrentNearbyStop] = useState(null); // Trạm hiện tại gần nhất
  const [hasShownModalForStop, setHasShownModalForStop] = useState(null); // Track đã hiện modal cho trạm nào
  const [isModalOpen, setIsModalOpen] = useState(false); // ⏸️ Track trạng thái modal (tạm dừng xe khi open)
  const [studentStatusResetTrigger, setStudentStatusResetTrigger] = useState(0); // ✅ Trigger reset trạng thái học sinh
  const animationIndexRef = useRef(0); // 🔧 Lưu index animation để không reset khi modal mở/đóng
  const [speedSegments, setSpeedSegments] = useState([]); // 🚗 Tốc độ từng đoạn: {start, end, speed, color}
  const [coloredSegments, setColoredSegments] = useState([]); // 🎨 Danh sách đoạn đường với màu sắc
  const [timeComparison, setTimeComparison] = useState(null); // ⏱️ So sánh thời gian với baseline

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
        console.log("🔍 Today's schedules found:", todaySchedules.length);

        // Transform backend data to component format
        const routes = await Promise.all(
          todaySchedules.map(async (schedule) => {
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

            // Fetch student count for this schedule
            let studentCount = 0;
            try {
              const loaiTuyen =
                scheduleType === "morning" ? "luot_di" : "luot_ve";
              const studentResponse =
                await StudentService.getCurrentScheduleStudents(loaiTuyen);

              if (
                studentResponse.students &&
                Array.isArray(studentResponse.students)
              ) {
                studentCount = studentResponse.students.length;
                console.log(
                  `📚 Schedule ${schedule.id} has ${studentCount} students`
                );
              }
            } catch (err) {
              console.error(
                `Error fetching students for schedule ${schedule.id}:`,
                err
              );
              // Use fallback from schedule if available
              studentCount = schedule.studentCount || schedule.students || 0;
            }

            return {
              id: schedule.id,
              routeId: schedule.route_id || schedule.routeId || "",
              shift: scheduleType === "morning" ? "Sáng" : "Chiều",
              name:
                schedule.title ||
                (scheduleType === "morning"
                  ? "Lượt đi buổi sáng"
                  : "Lượt về buổi chiều"),
              time: schedule.time,
              startTime: ` ${schedule.time}`,
              school: schedule.endLocation || "Trường học",
              students: studentCount,
              type: scheduleType,
              route: schedule.route || "",
              startLocation: schedule.startLocation || "",
              endLocation: schedule.endLocation || "",
              status: schedule.status || "chuabatdau",
              stops: schedule.stops || [],
              coordinates: coordinates,
              stations: stations,
            };
          })
        );

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
            students: schedule.studentCount || schedule.students || 0,
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
              students: schedule.studentCount || schedule.students || 0,
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
      // Reset animation index for new trip
      animationIndexRef.current = 0;

      // ✅ Reset tất cả trạng thái học sinh về 'choxacnhan' (UI + Database)
      setStudentStatusResetTrigger((prev) => prev + 1);

      // 🔗 Gọi API backend để reset tất cả học sinh trong database
      try {
        await TrackingService.resetScheduleStudentStatuses(route.id);
        console.log(
          `✅ Reset all students for schedule ${route.id} in database`
        );
      } catch (error) {
        console.warn("Warning: Could not reset students in database:", error);
        // Continue anyway - UI reset already done
      }

      // Call tracking API to start trip and simulator
      await TrackingService.startTrip(route.id);

      // 🚌 Fetch route đi qua TẤT CẢ các trạm (waypoints)
      const path = await fetchRouteFromOSRM(route.coordinates);
      setRoutePath(path);
      if (path.length > 0) {
        setBusPos(path[0]);
      }

      // 🚗 Tạo đoạn đường với tốc độ ngẫu nhiên
      const segments = generateRandomSpeedSegments(path.length);
      setSpeedSegments(segments);

      // ⏱️ Tính toán thời gian so với baseline
      const timeInfo = calculateTimeComparison(segments, path.length);
      setTimeComparison(timeInfo);

      // 📢 Gửi thông báo dự kiến thời gian đến cho phụ huynh
      sendArrivalTimeNotification(route, timeInfo);

      // Update local state
      setActiveTrip(route);
      setTripStarted(true);
      setSelectedStation(0);

      // 📋 TỰ ĐỘNG MỞ MODAL CHO TRẠM ĐẦU TIÊN NGAY KHI BẮT ĐẦU CHUYẾN
      console.log("📋 Mở modal cho trạm đầu tiên...");
      setIsModalOpen(true);
      const stops = await fetchStopsWithStudents(route.id);
      setStopsData(stops);
      setShowStudentModal(true);
      setHasShownModalForStop(0); // Mark first station as shown
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

  // Fetch danh sách học sinh theo trạm + tính khoảng cách
  const fetchStopsWithStudents = async (scheduleId) => {
    try {
      setLoadingStops(true);

      // Check if user is authenticated
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.error("❌ Not authenticated! No token found in sessionStorage");
        console.log("🔐 Please login first before starting a trip");
        alert("Vui lòng đăng nhập trước khi bắt đầu chuyến đi");
        setTripStarted(false);
        return [];
      }

      // Nếu chưa có vị trí bus, dùng vị trí đầu tiên của route
      let lat = busPos ? busPos[0] : routePath[0]?.[0] || 10.7769;
      let lng = busPos ? busPos[1] : routePath[0]?.[1] || 106.6869;

      console.log("📍 Fetching stops with students for schedule:", scheduleId);
      console.log("📍 Driver location:", { lat, lng });

      const stops = await StopService.getStopsWithStudents(
        scheduleId,
        lat,
        lng
      );

      setStopsData(stops);
      console.log("✅ Stops with students fetched:", stops);

      return stops;
    } catch (error) {
      console.error("Error fetching stops with students:", error);

      // Check if error is authentication related
      if (error.message && error.message.includes("401")) {
        alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        setTripStarted(false);
        return [];
      }

      alert("Lỗi tải danh sách học sinh: " + error.message);
      return [];
    } finally {
      setLoadingStops(false);
    }
  };

  // Cập nhật trạng thái học sinh
  const handleUpdateStudentStatus = async (scheduleStudentId, newStatus) => {
    try {
      console.log(
        `📝 Updating student ${scheduleStudentId} to status: ${newStatus}`
      );

      // 🔗 Gọi API để cập nhật trạng thái học sinh
      const response = await TrackingService.updateScheduleStudentStatus(
        scheduleStudentId,
        newStatus
      );

      console.log(
        `✅ Student ${scheduleStudentId} status updated to ${newStatus}:`,
        response
      );

      // 📡 Emit socket event để gửi real-time notification cho phụ huynh
      // Tìm thông tin học sinh từ stopsData
      const studentInfo = stopsData
        .flatMap((stop) => stop.students || [])
        .find((student) => student.scheduleStudentId === scheduleStudentId);

      if (studentInfo && TrackingService.socket) {
        const statusLabel =
          {
            choxacnhan: "Chờ xác nhận",
            dihoc: "Đi học",
            daxuong: "Đã xuống",
            vangmat: "Vắng mặt",
          }[newStatus] || newStatus;

        TrackingService.socket.emit("student-status-changed", {
          scheduleStudentId: scheduleStudentId,
          studentId: studentInfo.studentId,
          studentName: studentInfo.studentName,
          newStatus: newStatus,
          statusLabel: statusLabel,
          scheduleId: activeTrip?.id,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `📡 Real-time notification emitted for student ${studentInfo.studentName}`
        );
      }

      // ✅ UI đã cập nhật ngay tại StudentStopModal thông qua setStudentStatuses
      // Không cần gọi fetchStopsWithStudents vì component đã xử lý state update
      console.log("✅ Status updated - UI đã thay đổi ngay tại Modal");
    } catch (error) {
      console.error("Error updating student status:", error);
      alert("Lỗi cập nhật trạng thái học sinh");
    }
  };

  // 🎯 Haversine: Tính khoảng cách giữa 2 điểm (lat, lng)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Trả về khoảng cách (mét)
  };

  // 🔍 Phát hiện trạm gần nhất từ vị trí xe hiện tại
  const detectNearbyStop = async () => {
    if (!activeTrip || !busPos) return;

    const busLat = busPos[0];
    const busLng = busPos[1];

    // Tính khoảng cách tới tất cả trạm
    const stopsWithDistance = activeTrip.stations.map((station, index) => {
      const coord = activeTrip.coordinates[index];
      const distance = calculateDistance(busLat, busLng, coord[0], coord[1]);
      return {
        index,
        station,
        distance,
        isNearby: distance < 100, // Gần = < 100m
      };
    });

    // Tìm trạm gần nhất
    const nearestStop = stopsWithDistance.reduce((prev, curr) =>
      curr.distance < prev.distance ? curr : prev
    );

    console.log("🎯 Trạm gần nhất:", {
      name: nearestStop.station.name,
      distance: nearestStop.distance.toFixed(2) + "m",
      isNearby: nearestStop.isNearby,
    });

    setCurrentNearbyStop(nearestStop);

    // 🚨 FRONTEND CẢNHs BÁO: Nếu gần stop (< 500m) → Gửi signal lên backend
    const APPROACHING_THRESHOLD = 500; // 500m
    if (
      nearestStop.distance < APPROACHING_THRESHOLD &&
      nearestStop.distance > 0 &&
      activeTrip
    ) {
      // 📡 Gửi approaching-stop event từ frontend (distance-based)
      if (TrackingService.socket) {
        TrackingService.socket.emit("approaching-stop-frontend", {
          studentId: 0,
          studentName: "Học sinh",
          stopName: nearestStop.station.name,
          stopIndex: nearestStop.index,
          distanceToStop: Math.round(nearestStop.distance),
          scheduleId: activeTrip.id,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `🚨 FRONTEND EMITTING approaching-stop: ${
            nearestStop.station.name
          } (${nearestStop.distance.toFixed(1)}m)`
        );
      }
    }

    // 🚨 Nếu xe gần trạm (< 100m) VÀ chưa hiện modal cho trạm này
    // → Tự động mở modal
    if (nearestStop.isNearby && hasShownModalForStop !== nearestStop.index) {
      console.log(
        "⚠️ Xe đã tới trạm:",
        nearestStop.station.name,
        "- Mở modal tự động (⏸️ Tạm dừng xe)"
      );

      // ⏸️ Tạm dừng xe di chuyển
      setIsModalOpen(true);

      // Fetch dữ liệu học sinh cho trạm này
      const stops = await fetchStopsWithStudents(activeTrip.id);
      setStopsData(stops);

      // Mở modal
      setShowStudentModal(true);
      setSelectedStation(nearestStop.index);

      // Lưu lại: đã hiện modal cho trạm này rồi
      setHasShownModalForStop(nearestStop.index);
    }
  };

  // 📍 Effect: Phát hiện trạm mỗi khi xe di chuyển
  useEffect(() => {
    if (tripStarted && busPos) {
      detectNearbyStop();

      // 🔄 Nếu xe rời khỏi trạm trước đó (> 200m) → Reset flag để có thể hiện modal lại nếu quay lại
      if (
        hasShownModalForStop !== null &&
        currentNearbyStop &&
        currentNearbyStop.distance > 200
      ) {
        console.log("✅ Xe rời khỏi trạm - Reset flag");
        setHasShownModalForStop(null);
      }
    }
  }, [busPos, tripStarted, activeTrip]);

  // Mở modal khi tài xế đến trạm (hoặc bấn nút thủ công)
  const openStudentModal = async () => {
    if (!activeTrip) return;

    console.log("⏸️ Modal mở - Tạm dừng xe di chuyển");
    setIsModalOpen(true);

    const stops = await fetchStopsWithStudents(activeTrip.id);
    setShowStudentModal(true);
  };

  // Đóng modal - tiếp tục di chuyển
  const handleCloseStudentModal = () => {
    console.log("▶️ Modal đóng - Xe tiếp tục di chuyển");
    setShowStudentModal(false);
    setIsModalOpen(false);
  };

  const handleEndTrip = async () => {
    try {
      // Call tracking API to end trip
      if (activeTrip) {
        await TrackingService.endTrip(activeTrip.id);
      }

      // Reset animation index
      animationIndexRef.current = 0;

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
   * 🚗 Tạo đoạn đường với tốc độ ngẫu nhiên
   * @param {number} pathLength - Tổng độ dài đường
   * @returns {Array} Danh sách đoạn: {start, end, speed, color, interval}
   */
  const generateRandomSpeedSegments = (pathLength) => {
    const speeds = [
      { ms: 600, label: "Chậm", color: "#ef4444" }, // Chậm = Đỏ
      { ms: 400, label: "Vừa", color: "#3b82f6" }, // Vừa = Xanh
      { ms: 200, label: "Nhanh", color: "#3b82f6" }, // Nhanh = Xanh
    ];

    const segments = [];
    let currentPos = 0;

    // Chia route thành 3-6 đoạn ngẫu nhiên
    const numSegments = Math.floor(Math.random() * 4) + 3; // 3-6 đoạn
    const segmentLength = Math.floor(pathLength / numSegments);

    for (let i = 0; i < numSegments; i++) {
      const start = i * segmentLength;
      const end = i === numSegments - 1 ? pathLength : (i + 1) * segmentLength;

      // Chọn tốc độ ngẫu nhiên
      const randomSpeed = speeds[Math.floor(Math.random() * speeds.length)];

      segments.push({
        start,
        end,
        speed: randomSpeed.ms,
        color: randomSpeed.color,
        label: randomSpeed.label,
      });

      console.log(
        `🚗 Segment ${i + 1}: index ${start}-${end} | Tốc độ: ${
          randomSpeed.label
        } (${randomSpeed.ms}ms) | Màu: ${randomSpeed.color}`
      );
    }

    return segments;
  };

  /**
   * ⏱️ Tính toán thời gian so với baseline (400ms/point)
   * @param {Array} speedSegments - Danh sách segments với tốc độ
   * @param {number} pathLength - Tổng độ dài route (số points)
   * @returns {Object} {baseline, actual, difference, status, message}
   */
  const calculateTimeComparison = (speedSegments, pathLength) => {
    const BASELINE_MS = 400; // Tốc độ baseline trung bình

    // Tính thời gian baseline
    const baselineTime = pathLength * BASELINE_MS;

    // Tính thời gian thực tế từ segments
    let actualTime = 0;
    let countSlow = 0; // 600ms
    let countFast = 0; // 200ms

    speedSegments.forEach((segment) => {
      const segmentLength = segment.end - segment.start;
      actualTime += segmentLength * segment.speed;

      if (segment.speed === 600) countSlow++;
      if (segment.speed === 200) countFast++;
    });

    const timeDifference = actualTime - baselineTime;
    const percentDiff = ((timeDifference / baselineTime) * 100).toFixed(1);

    let status = "Đúng giờ"; // neutral
    let statusEmoji = "⏱️";
    let statusColor = "#3b82f6"; // blue

    if (timeDifference < -5000) {
      // Nhanh hơn nhiều (> 5 giây)
      status = "Rất sớm";
      statusEmoji = "🚀";
      statusColor = "#10b981"; // green
    } else if (timeDifference < 0) {
      // Nhanh hơn
      status = "Sớm hơn";
      statusEmoji = "⚡";
      statusColor = "#10b981"; // green
    } else if (timeDifference > 5000) {
      // Chậm hơn nhiều (> 5 giây)
      status = "Rất chậm";
      statusEmoji = "🐢";
      statusColor = "#ef4444"; // red
    } else if (timeDifference > 0) {
      // Chậm hơn
      status = "Chậm hơn";
      statusEmoji = "⏳";
      statusColor = "#f59e0b"; // orange
    }

    const baselineMin = (baselineTime / 1000 / 60).toFixed(1);
    const actualMin = (actualTime / 1000 / 60).toFixed(1);
    const diffMin = (Math.abs(timeDifference) / 1000 / 60).toFixed(1);

    const message = `${baselineMin}min (baseline) → ${actualMin}min (thực tế) | Chênh lệch: ${
      timeDifference < 0 ? "-" : "+"
    }${diffMin}min (${percentDiff}%)`;

    console.log(
      `📊 Thời gian: ${statusEmoji} ${status} | ${message} | Chậm: ${countSlow} | Nhanh: ${countFast}`
    );

    return {
      baseline: baselineTime,
      actual: actualTime,
      difference: timeDifference, // ms
      percentDiff: parseFloat(percentDiff),
      status,
      statusEmoji,
      statusColor,
      message,
      countSlow,
      countFast,
    };
  };

  /**
   * 📢 Gửi thông báo dự kiến thời gian đến cho phụ huynh
   * @param {Object} route - Thông tin chuyến đi
   * @param {Object} timeInfo - Kết quả tính toán thời gian
   */
  const sendArrivalTimeNotification = (route, timeInfo) => {
    if (!TrackingService.socket || !timeInfo) return;

    // Xác định loại thông báo dựa trên trạng thái thời gian
    let notificationType = "arrival-time-normal"; // default
    let notificationTitle = "📍 Dự kiến thời gian đến";
    let notificationColor = "#3b82f6"; // blue

    if (timeInfo.difference < -5000) {
      notificationType = "arrival-time-early";
      notificationTitle = "🚀 Xe sẽ đến sớm!";
      notificationColor = "#10b981"; // green
    } else if (timeInfo.difference < 0) {
      notificationType = "arrival-time-early";
      notificationTitle = "⚡ Xe sẽ đến sớm hơn dự kiến";
      notificationColor = "#10b981"; // green
    } else if (timeInfo.difference > 5000) {
      notificationType = "arrival-time-late";
      notificationTitle = "🐢 Xe sẽ đến chậm!";
      notificationColor = "#ef4444"; // red
    } else if (timeInfo.difference > 0) {
      notificationType = "arrival-time-late";
      notificationTitle = "⏳ Xe sẽ đến chậm hơn dự kiến";
      notificationColor = "#f59e0b"; // orange
    }

    // Tạo thông báo
    const notification = {
      type: notificationType,
      title: notificationTitle,
      message: timeInfo.message,
      color: notificationColor,
      status: timeInfo.status,
      statusEmoji: timeInfo.statusEmoji,
      routeName: route.name,
      routeId: route.id,
      scheduleId: route.id,
      driverId: user.id || user.driver_code,
      driverName: user.ho_ten || user.ten_tai_xe || user.name || "Tài xế",
      difference: timeInfo.difference, // ms
      percentDiff: timeInfo.percentDiff,
      timestamp: new Date().toISOString(),
    };

    // 📡 Gửi qua socket tới phụ huynh
    TrackingService.socket.emit("trip-time-notification", notification);

    console.log("📢 Sent arrival time notification:", {
      title: notificationTitle,
      message: timeInfo.message,
      color: notificationColor,
    });
  };

  /**
   * ⚡ Gửi vị trí xe bus từ dashboard tài xế tới backend
   * - Gửi qua WebSocket (real-time cho phụ huynh)
   * - Lưu vào Backend API (lưu vào database)
   * - ⏸️ TẠM DỪNG khi modal học sinh hiện lên
   */
  useEffect(() => {
    if (!tripStarted || !busLocation || !activeTrip || isModalOpen) return;

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
          routeId: activeTrip.routeId,
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
    isModalOpen,
  ]);

  /**
   * 🚌 Animation: Xe bus chạy dọc theo route với tốc độ ngẫu nhiên
   * ⏸️ TẠM DỪNG khi modal học sinh hiện lên
   * 🔧 Sử dụng useRef để lưu index, tránh reset khi modal mở/đóng
   * 🚗 Tốc độ: 200ms (Nhanh/Xanh), 400ms (Vừa/Xanh), 600ms (Chậm/Đỏ)
   */
  useEffect(() => {
    if (
      !tripStarted ||
      routePath.length === 0 ||
      isModalOpen ||
      speedSegments.length === 0
    )
      return;

    let interval;
    let lastFrameTime = 0;

    const animate = () => {
      const currentTime = Date.now();
      const currentIndex = animationIndexRef.current;

      // Tìm segment hiện tại để lấy tốc độ
      const currentSegment = speedSegments.find(
        (seg) => currentIndex >= seg.start && currentIndex < seg.end
      );
      const speedInterval = currentSegment ? currentSegment.speed : 200;

      // Chỉ cập nhật nếu đủ thời gian theo tốc độ segment
      if (currentTime - lastFrameTime >= speedInterval) {
        lastFrameTime = currentTime;

        animationIndexRef.current++;
        if (animationIndexRef.current >= routePath.length)
          animationIndexRef.current = 0;

        const currentPos = routePath[animationIndexRef.current];
        setBusPos(currentPos);

        // Cập nhật busLocation để gửi tới backend
        setBusLocation({
          latitude: currentPos[0],
          longitude: currentPos[1],
        });

        // Tính tiến độ dựa trên index
        const percentage =
          (animationIndexRef.current / Math.max(routePath.length - 1, 1)) * 100;
        const distance = animationIndexRef.current * 0.1;

        setTripProgress({
          percentage,
          distanceCovered: distance,
          currentStop: null,
        });

        const segmentLabel = currentSegment?.label || "Unknown";
        console.log("🚌 Bus moving:", {
          position: currentPos,
          progress: percentage.toFixed(1) + "%",
          index: animationIndexRef.current,
          speed: `${speedInterval}ms (${segmentLabel})`,
          color: currentSegment?.color,
        });
      }

      interval = requestAnimationFrame(animate);
    };

    interval = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(interval);
  }, [tripStarted, routePath, isModalOpen, speedSegments]);

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

          {/* Time Comparison Card */}
          {timeComparison && (
            <div
              className="trip-info-card"
              style={{
                borderLeft: `4px solid ${timeComparison.statusColor}`,
              }}
            >
              <div className="card-icon-trip">{timeComparison.statusEmoji}</div>
              <div className="card-content">
                <h4>{timeComparison.status}</h4>
                <p
                  style={{
                    color: timeComparison.statusColor,
                    fontSize: "13px",
                  }}
                >
                  {timeComparison.message}
                </p>
                <p
                  style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}
                >
                  Chậm: {timeComparison.countSlow} | Nhanh:{" "}
                  {timeComparison.countFast}
                </p>
              </div>
            </div>
          )}
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

                {/* 🎨 Draw colored polylines based on speed segments */}
                {speedSegments.length > 0 ? (
                  <ColoredSpeedPolylines
                    routePath={routePath}
                    speedSegments={speedSegments}
                  />
                ) : (
                  <RoutingPolyline
                    waypoints={activeTrip.coordinates}
                    color="#3b82f6"
                  />
                )}

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

                {/* Trạm gần nhất */}
                {currentNearbyStop && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px 12px",
                      backgroundColor: currentNearbyStop.isNearby
                        ? "#dbeafe"
                        : "#f3f4f6",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: currentNearbyStop.isNearby ? "#0284c7" : "#666",
                    }}
                  >
                    {currentNearbyStop.isNearby ? "🚨" : "📍"} Gần nhất:{" "}
                    {currentNearbyStop.station.name} (
                    {currentNearbyStop.distance.toFixed(0)}m)
                  </div>
                )}

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

            <button
              className="btn-student-modal"
              onClick={openStudentModal}
              style={{ marginTop: "12px" }}
            >
              📋 Quản lý học sinh tại trạm
            </button>
          </div>
        </div>

        {/* Student Stop Modal */}
        <StudentStopModal
          isOpen={showStudentModal}
          stops={stopsData}
          currentStopIndex={selectedStation}
          onClose={handleCloseStudentModal}
          onUpdateStudentStatus={handleUpdateStudentStatus}
          loading={loadingStops}
          scheduleType={activeTrip?.type}
          resetTrigger={studentStatusResetTrigger}
        />
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
                  <div
                    key={route.id}
                    className={`route-card-driver ${
                      route.status === "hoanthanh" ? "completed" : ""
                    }`}
                  >
                    <div
                      className={`status-routes-cards-driver ${route.status}`}
                    >
                      {route.status === "hoanthanh"
                        ? "Đã hoàn thành"
                        : "Sắp tới"}
                    </div>
                    <div className="route-card-header-driver">
                      <span className={`shift-badge-driver ${route.type}`}>
                        {route.shift}
                      </span>
                      <h4>{route.name}</h4>
                    </div>

                    <div className="route-card-body-driver">
                      <p className="route-info-driver">
                        <strong>Thời gian đầu tiên:</strong> {route.startTime}.
                        Lộ trình:{" "}
                        {route.stations && route.stations.length > 0
                          ? `${route.stations[0].name} ⇨ ${
                              route.stations[route.stations.length - 1].name
                            }`
                          : "bến xe ⇨ " + route.school}
                      </p>
                      <p className="route-info-driver">
                        Số học sinh trên chuyến: {route.students}
                      </p>
                    </div>

                    <button
                      className={`btn-start-route-driver ${
                        route.status === "hoanthanh" ? "completed" : ""
                      }`}
                      onClick={() => handleStartTrip(route)}
                      disabled={route.status === "hoanthanh"}
                    >
                      {route.status === "hoanthanh"
                        ? "Chuyến đi đã hoàn thành"
                        : "Bắt đầu chuyến đi"}
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

  const [availableRoutes, setAvailableRoutes] = useState([]); // List danh sách tuyến
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [studentsList, setStudentsList] = useState([]);

  // --- THAY THẾ TOÀN BỘ useEffect CŨ BẰNG CÁI NÀY ---
  useEffect(() => {
    const fetchRoutesAndStudents = async () => {
      try {
        console.log("🔄 Bắt đầu tải dữ liệu Dashboard (Logic mới)...");

        // 1. Gọi API lấy dữ liệu song song
        const [allRoutesData, myScheduleData, studentsData] = await Promise.all(
          [
            RouteService.getAllRoutesWithStops(),
            ScheduleService.getMySchedule(),
            StudentService.getAllStudents(),
          ]
        );

        // 2. Map Student Data Correctly
        const mappedStudents = studentsData.map((s) => {
          // Get Route ID
          const rId =
            s.current_route_id ||
            s.route_id ||
            s.routeId ||
            s.default_route_stop_id_di ||
            0; // Use default route if available

          // Get Parent ID - STRICT CHECK
          // In student.service.js, it returns 'parent_id' at the root level
          const pId = s.parent_id;

          if (!pId) {
            console.warn(
              `⚠️ Warning: Student [${s.ho_ten || s.id}] has no Parent ID!`
            );
          }

          return {
            id: s.id,
            fullname: s.ho_ten || s.fullname || s.ho_ten_hs,
            routeId: String(rId),
            parentId: pId, // Do NOT use "|| s.id" here
          };
        });

        // Filter out students with no valid parent
        const validStudents = mappedStudents.filter((s) => s.parentId);
        setStudentsList(validStudents);

        // ---------------------------------------------------------
        // BƯỚC 2: TẠO DROPDOWN TUYẾN TỪ LỊCH TRÌNH (QUAN TRỌNG)
        // ---------------------------------------------------------

        // Làm phẳng dữ liệu lịch trình (xử lý cả trường hợp Array hoặc Object)
        let allSchedules = [];
        if (Array.isArray(myScheduleData)) {
          allSchedules = myScheduleData;
        } else if (myScheduleData && typeof myScheduleData === "object") {
          allSchedules = Object.values(myScheduleData).flat();
        }

        // Dùng Map để lọc trùng lặp (Key: ID Tuyến -> Value: Tên Tuyến)
        const uniqueRoutesMap = new Map();

        allSchedules.forEach((schedule) => {
          // A. Tìm ID Tuyến
          const rId =
            schedule.route_id ||
            (schedule.route && schedule.route.id) ||
            schedule.id;

          // B. Tìm Tên Tuyến (Lấy ngay trong lịch trình để chắc chắn có hiển thị)
          let rName = "";
          if (schedule.route_name) rName = schedule.route_name;
          else if (schedule.route && schedule.route.name)
            rName = schedule.route.name;
          else if (schedule.title)
            rName = schedule.title; // Lấy tiêu đề lịch làm tên
          else rName = `Tuyến số ${rId}`; // Nếu không có tên thì tự đặt

          // Format thêm (Sáng/Chiều) cho dễ nhìn
          const shift =
            schedule.type === "luot_di"
              ? "(Đi)"
              : schedule.type === "luot_ve"
              ? "(Về)"
              : "";
          const finalName = `${rName} ${shift}`.trim();

          // C. Lưu vào Map (Chỉ lưu nếu có ID)
          if (rId) {
            uniqueRoutesMap.set(String(rId), finalName);
          }
        });

        // Chuyển Map thành Mảng để hiển thị lên Dropdown
        const routesForDropdown = Array.from(uniqueRoutesMap.entries()).map(
          ([id, name]) => ({
            id: id,
            name: name,
          })
        );

        console.log("✅ Danh sách tuyến cho Dropdown:", routesForDropdown);

        // FALLBACK: Nếu vẫn rỗng (Tài xế chưa có lịch), lấy đại từ AllRoutes để test
        if (routesForDropdown.length === 0) {
          console.warn("⚠️ Không tìm thấy lịch, dùng danh sách gốc để test.");
          // Map danh sách gốc thành format chuẩn
          const fallbackRoutes = allRoutesData.map((r) => ({
            id: String(r.id),
            name: r.name,
          }));
          setAvailableRoutes(fallbackRoutes);
        } else {
          setAvailableRoutes(routesForDropdown);
        }
      } catch (error) {
        console.error("❌ Lỗi tải dữ liệu:", error);
      }
    };

    fetchRoutesAndStudents();
  }, []);

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

  // Dashboard.jsx

  // Dashboard.jsx

  // Dashboard.jsx

  async function sendAlert() {
    // 1. Validate
    if (!alertMessage.trim()) return alert("Vui lòng nhập nội dung!");
    if (!alertType) return alert("Vui lòng chọn loại cảnh báo!");
    if (!sendToParents && !sendToAdmin) return alert("Chọn người nhận!");

    // 2. TẠO DANH SÁCH ID NGƯỜI NHẬN
    let finalRecipientIds = [];

    // Thêm Admin (ID mặc định là 1)
    if (sendToAdmin) finalRecipientIds.push(1);

    // Thêm Phụ huynh theo Tuyến
    if (sendToParents) {
      if (!selectedRouteId) return alert("Vui lòng chọn tuyến xe áp dụng!");

      console.log("🔍 Đang lọc phụ huynh cho tuyến ID:", selectedRouteId);

      // Lọc học sinh thuộc tuyến đã chọn
      // Lưu ý: So sánh String để tránh lỗi '1' !== 1
      const targetStudents = studentsList.filter(
        (s) => String(s.routeId) === String(selectedRouteId)
      );

      console.log(`✅ Tìm thấy ${targetStudents.length} học sinh trong tuyến.`);

      if (targetStudents.length === 0) {
        // Debug: In ra thử 1 học sinh để xem tại sao không khớp
        if (studentsList.length > 0)
          console.log("Sample Data:", studentsList[0]);
        return alert("Không tìm thấy phụ huynh nào trong tuyến này!");
      }

      // Lấy ID phụ huynh (tránh trùng lặp)
      targetStudents.forEach((s) => {
        // Ưu tiên lấy parent_id, nếu không có thì lấy id (tùy cấu trúc DB của bạn)
        const pid = parseInt(s.parent_id || s.parentId || s.id);
        if (!isNaN(pid) && !finalRecipientIds.includes(pid)) {
          finalRecipientIds.push(pid);
        }
      });
    }

    if (finalRecipientIds.length === 0) {
      return alert("Danh sách người nhận rỗng!");
    }

    // 3. GỬI API
    try {
      const res = await NotificationService.sendAlert({
        recipient_ids: finalRecipientIds,
        message: alertMessage,
        alertType: alertType,
      });

      // Check success based on your backend response structure
      if (res && (res.success || res.recipientCount > 0 || res.message)) {
        alert(`Gửi thành công cho ${finalRecipientIds.length} người!`);
        setShowAlertModal(false);
        setAlertMessage("");
        setSendToParents(false);
        setSelectedRouteId("");
      } else {
        alert("Gửi không thành công (Server không trả về kết quả chuẩn).");
      }
    } catch (error) {
      console.error("❌ Lỗi gửi:", error);
      alert("Gửi thất bại.");
    }
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
          onClick={() => setShowAlertModal(false)}
        >
          <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Gửi cảnh báo khẩn cấp</h3>

            <div className="alert-type-group">
              <textarea
                placeholder="Nhập nội dung cảnh báo..."
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                rows={4}
                style={{ width: "100%" }}
              />
              <div
                style={{ display: "grid", gap: "10px", marginBottom: "15px" }}
              >
                {[
                  ["delay", "Đến trễ"],
                  ["accident", "Sự cố"],
                  ["other", "Khác"],
                ].map(([val, label]) => (
                  <label
                    key={val}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="atype"
                      value={val}
                      onChange={(e) => setAlertType(e.target.value)}
                      style={{
                        marginRight: "8px",
                        width: "16px",
                        height: "16px",
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            {/* ------------------------------------------------------------- */}

            <div className="alert-options">
              {/* <label>
            <input
              type="checkbox"
              checked={sendToParents}
              onChange={(e) => {
                  // CHỈ set state của phụ huynh, KHÔNG can thiệp admin
                  setSendToParents(e.target.checked); 
              }}
            />{" "}
            Gửi cho Phụ huynh
          </label> */}

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

            {/* --- PHẦN THÊM MỚI: Dropdown chọn tuyến --- */}
            {sendToParents && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  background: "#f8f9fa",
                  borderRadius: "5px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  Chọn tuyến xe áp dụng:
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                >
                  <option value="">-- Vui lòng chọn tuyến --</option>
                  {availableRoutes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* ------------------------------------------- */}

            <div
              className="alert-actions"
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setShowAlertModal(false)}
              >
                Hủy
              </button>
              <button className="btn btn-primary" onClick={sendAlert}>
                Gửi Cảnh Báo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
