import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Header from "../../components/common/Header/header";
import Sidebar from "../../components/common/Sidebar/Sidebar";
import Assignments from "./Assignments";
import Students from "./Students";
import Notifications from "./Notifications";
import "./Dashboard.css";
import drivers from "../../data/drivers";
import ScheduleService from "../../services/schedule.service";
import useDriverScheduleSocket from "../../hooks/useDriverScheduleSocket";
import NotificationService from "../../services/notification.service";
import RouteService from "../../services/route.service";
import StudentService from "../../services/student.service";

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

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];
        const todaySchedules = response[today] || [];

        // Transform backend data to component format
        const routes = todaySchedules.map((schedule) => {
          // Convert stops array to stations format
          let stations = [];
          if (schedule.stops && Array.isArray(schedule.stops)) {
            stations = schedule.stops.map((stop, index) => ({
              id: index + 1,
              name: stop,
              time:
                index === 0
                  ? schedule.time
                  : index === schedule.stops.length - 1
                  ? "Dự kiến đến"
                  : "",
              status: index === 0 ? "pending" : "pending",
            }));
          } else {
            // Fallback if no stops provided
            stations = [
              {
                id: 1,
                name: schedule.startLocation || "Điểm khởi hành",
                time: schedule.time,
                status: "pending",
              },
              {
                id: 2,
                name: schedule.endLocation || "Điểm kết thúc",
                time: "Dự kiến đến",
                status: "pending",
              },
            ];
          }

          return {
            id: schedule.id,
            shift: schedule.type === "morning" ? "Sáng" : "Chiều",
            name:
              schedule.title ||
              (schedule.type === "morning"
                ? "Lượt đi buổi sáng"
                : "Lượt về buổi chiều"),
            time: schedule.time,
            startTime: `Lộ trạm đầu tiên: ${schedule.time}`,
            school: schedule.endLocation || "Trường học",
            students: 0, // Will be updated if we fetch student list
            type: schedule.type,
            route: schedule.route || "",
            startLocation: schedule.startLocation || "",
            endLocation: schedule.endLocation || "",
            status: schedule.status || "chuabatdau",
            stops: schedule.stops || [],
            coordinates: [
              [10.762622, 106.660172],
              [10.771513, 106.677887],
              [10.773431, 106.688034],
              [10.776889, 106.700928],
            ],
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
        // Convert stops array to stations format
        let stations = [];
        if (schedule.stops && Array.isArray(schedule.stops)) {
          stations = schedule.stops.map((stop, index) => ({
            id: index + 1,
            name: stop,
            time:
              index === 0
                ? schedule.time
                : index === schedule.stops.length - 1
                ? "Dự kiến đến"
                : "",
            status: "pending",
          }));
        } else {
          stations = [
            {
              id: 1,
              name: schedule.startLocation || "Điểm khởi hành",
              time: `${schedule.time?.substring(0, 5) || schedule.time}`,
              status: "pending",
            },
            {
              id: 2,
              name: schedule.endLocation || "Điểm kết thúc",
              time: "Dự kiến đến",
              status: "pending",
            },
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
            coordinates: [
              [10.762622, 106.660172],
              [10.771513, 106.677887],
              [10.773431, 106.688034],
              [10.776889, 106.700928],
            ],
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
              coordinates: [
                [10.762622, 106.660172],
                [10.771513, 106.677887],
                [10.773431, 106.688034],
                [10.776889, 106.700928],
              ],
              stations: [
                {
                  id: 1,
                  name: schedule.startLocation || "Điểm khởi hành",
                  time: `${schedule.time?.substring(0, 5) || schedule.time}`,
                  status: "pending",
                },
                {
                  id: 2,
                  name: schedule.endLocation || "Điểm kết thúc",
                  time: "Dự kiến đến",
                  status: "pending",
                },
              ],
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

  const handleStartTrip = (route) => {
    setActiveTrip(route);
    setTripStarted(true);
    setSelectedStation(0);
  };

  const handleEndTrip = () => {
    setTripStarted(false);
    setActiveTrip(null);
    setSelectedStation(0);
    // Clear trip state from sessionStorage
    sessionStorage.removeItem("tripStarted");
    sessionStorage.removeItem("activeTrip");
    sessionStorage.removeItem("selectedStation");
  };

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

                <Polyline
                  positions={activeTrip.coordinates}
                  color="#3b82f6"
                  weight={5}
                  opacity={0.8}
                />

                {activeTrip.coordinates.map((coord, index) => (
                  <Marker key={index} position={coord}>
                    <Popup>
                      {activeTrip.stations[index]?.name || `Trạm ${index + 1}`}
                    </Popup>
                  </Marker>
                ))}
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
              <span className="search-label">
                Trạm hiện tại:
                <br />
                {activeTrip.stations[selectedStation]?.name || "..."}
              </span>
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
                    <Polyline
                      positions={route.coordinates}
                      color={route.type === "morning" ? "#3b82f6" : "#f59e0b"}
                      weight={4}
                      opacity={0.7}
                    />

                    {/* Start marker */}
                    <Marker position={route.coordinates[0]}>
                      <Popup>
                        <strong>{route.name}</strong>
                        <br />
                        Điểm đầu
                        <br />
                        {route.startTime}
                      </Popup>
                    </Marker>

                    {/* End marker */}
                    <Marker
                      position={route.coordinates[route.coordinates.length - 1]}
                    >
                      <Popup>
                        <strong>{route.name}</strong>
                        <br />
                        Điểm cuối - {route.school}
                      </Popup>
                    </Marker>
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


  // Dashboard.jsx - Bên trong component DriverDashboard

 useEffect(() => {
    const fetchAndMockStudents = async () => {
      try {
        // Lấy danh sách học sinh
        const studentsData = await StudentService.getAllStudents();
        
        // Lấy danh sách ID các tuyến hiện có (từ state availableRoutes đã load ở trên)
        // Lưu ý: availableRoutes cần load xong trước, hoặc ta lấy ID từ mock logic
        // Để đơn giản, ta giả định tuyến là 1,2,3,4... nếu availableRoutes rỗng
        const routeIds = availableRoutes.length > 0 
            ? availableRoutes.map(r => parseInt(r.id)) 
            : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; 

        const mappedStudents = studentsData.map((student, index) => {
             // Logic Mock Data tương tự bên Message.jsx
             let realRouteId = parseInt(student.current_route_id || student.route_id || 0, 10);
             
             if ((realRouteId === 0 || isNaN(realRouteId)) && routeIds.length > 0) {
                 realRouteId = routeIds[index % routeIds.length];
             }

             return {
                 id: student.id, // Dùng làm ID phụ huynh luôn (do DB thiếu)
                 fullname: student.ho_ten,
                 routeId: realRouteId
             };
        });
        
        console.log("✅ Đã tải và Mock tuyến cho học sinh bên Driver:", mappedStudents.length);
        setStudentsList(mappedStudents);

      } catch (error) {
        console.error("Lỗi tải học sinh:", error);
      }
    };

    // Chỉ chạy khi availableRoutes đã có dữ liệu (để chia tuyến cho đều)
    if(availableRoutes.length > 0) {
        fetchAndMockStudents();
    }
  }, [availableRoutes]);
  useEffect(() => {
    const fetchRoutesFromSchedule = async () => {
      try {
        // 1. Chỉ gọi API lấy lịch trình (cái này chắc chắn có dữ liệu vì Trang chủ đã hiện)
        const scheduleData = await ScheduleService.getMySchedule();
        
        // 2. Gom lịch của tất cả các ngày lại
        // Object.values trả về mảng các mảng lịch -> .flat() làm phẳng thành 1 mảng duy nhất
        const allSchedules = scheduleData ? Object.values(scheduleData).flat() : [];
        
        // 3. Dùng Map để lọc trùng (một tuyến chạy nhiều ngày chỉ lấy 1 lần)
        const uniqueRoutesMap = new Map();

        allSchedules.forEach(item => {
            // Cố gắng tìm ID tuyến. 
            // Ưu tiên: route_id -> item.route.id -> cuối cùng là item.id (ID lịch trình - phương án dự phòng)
            const rId = item.route_id || (item.route && item.route.id) || item.id;
            
            // Cố gắng tìm Tên tuyến
            let rName = "";
            if (item.route_name) rName = item.route_name;
            else if (typeof item.route === 'string') rName = item.route; // Nếu route trả về là string tên
            else if (item.route && item.route.name) rName = item.route.name;
            else if (item.title) rName = item.title;
            else rName = `Tuyến #${rId}`;

            // Format tên: Thêm (Sáng)/(Chiều) nếu cần để dễ phân biệt
            const shiftName = item.type === 'luot_di' ? '(Đi)' : (item.type === 'luot_ve' ? '(Về)' : '');
            const finalName = `${rName} ${shiftName}`.trim();

            // Chỉ thêm vào map nếu có ID và chưa tồn tại
            if (rId && !uniqueRoutesMap.has(rId)) {
                uniqueRoutesMap.set(rId, finalName);
            }
        });

        // 4. Chuyển Map thành mảng cho Dropdown
        const routesForDropdown = Array.from(uniqueRoutesMap.entries()).map(([id, name]) => ({
            id: id,
            name: name
        }));

        console.log("✅ Đã tìm thấy các tuyến:", routesForDropdown);
        setAvailableRoutes(routesForDropdown);

      } catch (error) {
        console.error("❌ Lỗi lấy danh sách tuyến:", error);
        setAvailableRoutes([]);
      }
    };

    fetchRoutesFromSchedule();
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

  async function sendAlert() {
    // 1. Validate
    if (!alertMessage.trim()) return alert("Vui lòng nhập nội dung!");
    if (!alertType) return alert("Vui lòng chọn loại cảnh báo!");
    if (!sendToParents && !sendToAdmin) return alert("Chọn người nhận!");

    // 2. TẠO DANH SÁCH ID NGƯỜI NHẬN (Mảng số nguyên)
let finalRecipientIds = [];

// Thêm Admin
if (sendToAdmin) finalRecipientIds.push(1);

// Thêm Phụ huynh
if (sendToParents) {
    console.log("🔍 Đang Debug lọc phụ huynh:");
    console.log("   - Tuyến đang chọn (selectedRouteId):", selectedRouteId, typeof selectedRouteId);
    
    // In ra thử 1 học sinh để xem cấu trúc data
    if (studentsList.length > 0) {
        console.log("   - Data mẫu học sinh:", studentsList[0]);
    } else {
        console.warn("   ⚠️ Danh sách học sinh (studentsList) đang RỖNG!");
    }

    // SỬA LẠI LOGIC LỌC: Chuyển hết về String để so sánh cho chắc chắn
    const targetStudents = studentsList.filter(s => {
        // Log so sánh từng người (nếu cần thiết thì bật lên)
        // console.log(`So sánh: ${s.routeId} vs ${selectedRouteId}`);
        return String(s.routeId) === String(selectedRouteId);
    });

    console.log(`✅ Tìm thấy ${targetStudents.length} học sinh khớp tuyến.`);

    targetStudents.forEach(s => {
        // QUAN TRỌNG: Chỉ lấy ID nếu nó là số hợp lệ
        const pid = parseInt(s.id);
        if (!isNaN(pid) && !finalRecipientIds.includes(pid)) {
            finalRecipientIds.push(pid);
        }
    });
}

// Nếu danh sách rỗng thì chặn luôn, không gửi API nữa để đỡ rối
if (finalRecipientIds.length === 0) {
    return alert("Lỗi: Danh sách người nhận rỗng! Hãy kiểm tra Console (F12) để xem chi tiết.");
}

    // 3. GỬI API (1 Request duy nhất chứa mảng ID)
    try {
        console.log("🚀 Payload gửi đi:", { 
            recipient_ids: finalRecipientIds, 
            message: alertMessage 
        });

        // Gọi endpoint map với hàm sendDriverAlert vừa viết ở Backend
        const res = await NotificationService.sendAlert({
            recipient_ids: finalRecipientIds, // Backend sẽ nhận mảng này
            message: alertMessage,
            alertType: alertType
        });

        console.log("✅ Kết quả Server:", res);
        alert(`Gửi thành công cho ${finalRecipientIds.length} người!`);

        // Reset Form
        setShowAlertModal(false);
        setAlertMessage("");
        setSendToParents(false); 
        setSelectedRouteId("");

    } catch (error) {
        console.error("❌ Lỗi:", error);
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
      <div className="alert-modal-overlay" onClick={() => setShowAlertModal(false)}>
        <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
          <h3>Gửi cảnh báo khẩn cấp</h3>
          
          <div className="alert-type-group">

              <textarea
                placeholder="Nhập nội dung cảnh báo..."
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                rows={4}
                style={{ width: '100%'}}
              />
                <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
                    {[['delay', 'Đến trễ'], ['accident', 'Sự cố'], ['other', 'Khác']].map(([val, label]) => (
                      <label key={val} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="atype" 
                          value={val} 
                          onChange={(e) => setAlertType(e.target.value)} 
                          style={{ marginRight: '8px', width: '16px', height: '16px' }} 
                        />
                        {label}
                      </label>
                    ))}
                  </div>
          </div>
          {/* ------------------------------------------------------------- */}

          <div className="alert-options">
          <label>
            <input
              type="checkbox"
              checked={sendToParents}
              onChange={(e) => {
                  // CHỈ set state của phụ huynh, KHÔNG can thiệp admin
                  setSendToParents(e.target.checked); 
              }}
            />{" "}
            Gửi cho Phụ huynh
          </label>

            <label >
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
            <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                    Chọn tuyến xe áp dụng:
                </label>
                <select
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
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

          <div className="alert-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setShowAlertModal(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={sendAlert}>Gửi Cảnh Báo</button>
          </div>
        </div>
      </div>
)}
    </div>
  );
}
