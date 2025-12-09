import React, { useState, useEffect, useRef } from "react";
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
import Header from "../../components/common/Header/header";
import "./Bus.css";
import BusService from "../../services/bus.service";
import RouteService from "../../services/route.service";
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

// Component để vẽ polyline nối các trạm dừng
const RoutingPolyline = ({ waypoints, color = "#3b82f6" }) => {
  const map = useMap();
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !waypoints || waypoints.length < 2) return;

    // Clean up old polyline
    if (polylineRef.current) {
      try {
        map.removeLayer(polylineRef.current);
      } catch (e) {}
      polylineRef.current = null;
    }

    try {
      // Vẽ polyline nối các trạm dừng
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

export default function Bus() {
  const mapRef = useRef(null);
  const lastLocationRef = useRef(null);

  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [routePath, setRoutePath] = useState([]);
  const [busPos, setBusPos] = useState(null);
  const [stations, setStations] = useState([]);
  const [newBusData, setNewBusData] = useState({
    licensePlate: "",
    manufacturer: "",
    seats: "",
    yearManufactured: "",
    maintenanceDate: "",
  });

  // Load data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [busesData, routesData] = await Promise.all([
        BusService.getAllBuses(),
        RouteService.getAllRoutesWithStops(), // Sử dụng getAllRoutesWithStops để có đủ thông tin
      ]);
      setBuses(busesData);
      setRoutes(routesData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Không thể tải dữ liệu. Vui lòng kiểm tra kết nối backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (bus) => {
    setSelectedBus(bus);
    setShowDetailModal(true);
  };

  const handleViewLocation = async (e, bus) => {
    e.stopPropagation();

    if (bus.status !== "Đang hoạt động") {
      alert("Xe này không hoạt động nên không có vị trí!");
      return;
    }

    setSelectedBus(bus);
    setRoutePath([]);
    setStations([]);
    setBusPos(null);
    lastLocationRef.current = null;

    // Tìm route tương ứng với xe
    const busRoute = routes.find((route) => {
      return bus.route && route.name && bus.route.trim() === route.name.trim();
    });

    if (!busRoute) {
      console.log("Debug - Bus route:", bus.route);
      console.log(
        "Debug - Available routes:",
        routes.map((r) => r.name)
      );
      alert(
        `Không tìm thấy tuyến đường cho xe này! Tuyến: ${
          bus.route || "Chưa phân tuyến"
        }`
      );
      return;
    }

    // Setup route path with OSRM routing through all stops
    try {
      const path = await fetchRouteWithStops(busRoute);
      setRoutePath(path);

      // Sử dụng thực tế các trạm dừng từ route
      if (busRoute.stops && busRoute.stops.length > 0) {
        setStations(busRoute.stops);
      } else {
        // Fallback: dùng dummy stops
        const dummyStops = [
          {
            id: 1,
            name: "Điểm khởi hành",
            dia_chi: "Chờ thông tin",
            position: busRoute.start,
          },
          {
            id: 2,
            name: "Trạm trung gian",
            dia_chi: "Đường Võ Văn Kiệt",
            position: [
              (busRoute.start[0] + busRoute.end[0]) / 2,
              (busRoute.start[1] + busRoute.end[1]) / 2,
            ],
          },
          {
            id: 3,
            name: "Trường học",
            dia_chi: "Vinschool",
            position: busRoute.end,
          },
        ];
        setStations(dummyStops);
      }
    } catch (err) {
      console.error("Error setting up route:", err);
    }

    setShowLocationModal(true);
  };

  // Fetch route from OSRM using all stops
  async function fetchRouteWithStops(route) {
    let waypoints = [];

    if (route.stops && route.stops.length > 0) {
      // Build waypoints from all stops
      waypoints = route.stops
        .map((stop) => {
          if (stop.position && stop.position.length === 2) {
            const lat = stop.position[0];
            const lng = stop.position[1];
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

    const waypointsStr = waypoints.map((w) => `${w[0]},${w[1]}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson`;

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

  // Listen for real-time bus locations from drivers
  useEffect(() => {
    if (!showLocationModal || !selectedBus) return;

    console.log("📡 Setting up real-time location listener for bus");

    ParentTrackingService.initSocket();
    ParentTrackingService.joinParentTracking();

    // Remove old listener
    ParentTrackingService.socket?.off("bus-location-update");

    const handleBusLocationUpdate = (data) => {
      console.log("🚌 Bus received location update:", data);

      // Only accept driver-sourced data
      if (!data.driverId) {
        console.log("⏭️ Skipping non-driver location update");
        return;
      }

      // Update location if location changed
      if (data.location) {
        const newLat = data.location.latitude;
        const newLng = data.location.longitude;

        if (
          !lastLocationRef.current ||
          lastLocationRef.current.latitude !== newLat ||
          lastLocationRef.current.longitude !== newLng
        ) {
          lastLocationRef.current = { latitude: newLat, longitude: newLng };
          setBusPos({ latitude: newLat, longitude: newLng });
          console.log(`📍 Bus position updated: ${newLat}, ${newLng}`);
        }
      }
    };

    ParentTrackingService.socket?.on(
      "bus-location-update",
      handleBusLocationUpdate
    );
    console.log("👂 Listening to real-time bus location updates");

    return () => {
      ParentTrackingService.socket?.off(
        "bus-location-update",
        handleBusLocationUpdate
      );
      console.log("🛑 Stopped listening to bus location updates");
    };
  }, [showLocationModal, selectedBus]);

  // Auto-fit map when routePath changes
  useEffect(() => {
    if (routePath.length > 0 && mapRef.current && mapRef.current._container) {
      try {
        const bounds = L.latLngBounds(routePath);
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      } catch (err) {
        console.warn("Error fitting bounds:", err);
      }
    }
  }, [routePath]);

  const handleEdit = (e, bus) => {
    e.stopPropagation();
    setSelectedBus(bus);
    setEditFormData({ ...bus });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await BusService.updateBus(selectedBus.id, editFormData);
      await loadData();
      setShowEditModal(false);
      alert("Cập nhật xe thành công!");
    } catch (error) {
      console.error("Error updating bus:", error);
      alert("Không thể cập nhật xe. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa xe buýt này?")) {
      try {
        await BusService.deleteBus(id);
        await loadData();
        alert("Xóa xe thành công!");
      } catch (error) {
        console.error("Error deleting bus:", error);
        alert("Không thể xóa xe. Vui lòng thử lại.");
      }
    }
  };

  const handleAdd = () => {
    setNewBusData({
      licensePlate: "",
      manufacturer: "",
      seats: "",
      yearManufactured: "",
      maintenanceDate: "",
    });
    setShowAddModal(true);
  };

  const handleSaveNewBus = async () => {
    if (
      !newBusData.licensePlate ||
      !newBusData.manufacturer ||
      !newBusData.seats ||
      !newBusData.yearManufactured ||
      !newBusData.maintenanceDate
    ) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      await BusService.createBus(newBusData);
      await loadData();
      setShowAddModal(false);
      setNewBusData({
        licensePlate: "",
        manufacturer: "",
        seats: "",
        yearManufactured: "",
        maintenanceDate: "",
      });
      alert("Thêm xe mới thành công!");
    } catch (error) {
      console.error("Error creating bus:", error);
      alert("Không thể thêm xe mới. Vui lòng thử lại.");
    }
  };

  const filteredBuses = buses.filter(
    (bus) =>
      bus.id.toString().includes(searchTerm) ||
      (bus.licensePlate &&
        bus.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bus.manufacturer &&
        bus.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bus.status &&
        bus.status.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="bus-page">
        <Header title="Xe buýt" />
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bus-page">
      <Header title="Xe buýt" />

      <div className="bus-content">
        <div className="bus-grid">
          {filteredBuses.map((bus, index) => (
            <div
              className="bus-card"
              key={index}
              onClick={() => handleViewDetail(bus)}
            >
              <div className="bus-image-container">
                <img src={bus.image} alt="Bus" className="bus-image" />
              </div>
              <div className="bus-info">
                <div className="bus-details">
                  <p className="bus-id">Mã: {bus.id}</p>
                  <p className="bus-route">Tuyến đường: {bus.route}</p>
                  <p className="bus-status">Trạng thái: {bus.status}</p>
                </div>

                <div className="bus-actions">
                  <div>
                    <button
                      className={`action-btn-bus view-btn-bus ${
                        bus.status !== "Đang hoạt động" ? "disabled" : ""
                      }`}
                      onClick={(e) => handleViewLocation(e, bus)}
                      disabled={bus.status !== "Đang hoạt động"}
                      title={
                        bus.status === "Đang hoạt động"
                          ? "Xem vị trí"
                          : "Xe không hoạt động"
                      }
                    >
                      <span className="icon">🗺️</span>
                      Xem vị trí
                    </button>
                  </div>
                  <div className="edit-delete-btn">
                    <div className="edit-btn-container">
                      <button
                        className="action-btn-bus edit-btn-bus"
                        onClick={(e) => handleEdit(e, bus)}
                        title="Chỉnh sửa"
                      >
                        <img src="/icons/edit.png" alt="Edit" />
                      </button>
                    </div>
                    <div className="delete-btn-container">
                      <button
                        className="action-btn-bus delete-btn-bus"
                        onClick={(e) => handleDelete(e, bus.id)}
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
          className="add-btn"
          onClick={handleAdd}
          title="Thêm xe buýt mới"
        >
          <span className="plus-icon">+</span>
        </button>
      </div>

      {/* Modal Xem Chi Tiết */}
      {showDetailModal && selectedBus && (
        <div
          className="bus-modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div className="bus-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bus-modal-header">
              <h2>Xe Bus: Số {selectedBus.id}</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className="bus-modal-body">
              <div className="bus-modal-image">
                <img src={selectedBus.image} alt="Bus" />
              </div>

              <div className="bus-modal-info">
                <div className="info-row">
                  <span className="info-label">Biến số:</span>
                  <span className="info-value">{selectedBus.licensePlate}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Hãng:</span>
                  <span className="info-value">{selectedBus.manufacturer}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Lịch bảo dưỡng:</span>
                  <span className="info-value">
                    {selectedBus.maintenanceDate}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Số chỗ ngồi:</span>
                  <span className="info-value">{selectedBus.seats}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Năm sản xuất:</span>
                  <span className="info-value">
                    {selectedBus.yearManufactured}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Quãng đường đã chạy:</span>
                  <span className="info-value">
                    {selectedBus.distanceTraveled}km
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Trạng Thái:</span>
                  <span className="info-value">{selectedBus.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa */}
      {showEditModal && selectedBus && (
        <div
          className="bus-modal-overlay"
          onClick={() => setShowEditModal(false)}
        >
          <div className="bus-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bus-modal-header">
              <h2>Chỉnh sửa Xe Bus: Số {selectedBus.id}</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <div className="bus-modal-body">
              <div className="bus-modal-image">
                <img src={selectedBus.image} alt="Bus" />
              </div>

              <div className="bus-modal-info">
                <div className="edit-field">
                  <label>Biến số:</label>
                  <input
                    type="text"
                    value={editFormData.licensePlate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        licensePlate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="edit-field">
                  <label>Hãng:</label>
                  <input
                    type="text"
                    value={editFormData.manufacturer}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        manufacturer: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="edit-field">
                  <label>Lịch bảo dưỡng:</label>
                  <input
                    type="date"
                    value={editFormData.maintenanceDate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        maintenanceDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="edit-field">
                  <label>Số chỗ ngồi:</label>
                  <input
                    type="number"
                    value={editFormData.seats}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        seats: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="edit-field">
                  <label>Năm sản xuất:</label>
                  <input
                    type="number"
                    value={editFormData.yearManufactured}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        yearManufactured: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="edit-field">
                  <label>Trạng thái:</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="Đang hoạt động">Đang hoạt động</option>
                    <option value="Bảo trì">Bảo trì</option>
                    <option value="Ngừng">Ngừng</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bus-modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button className="btn-save" onClick={handleSaveEdit}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Xe Bus Mới */}
      {showAddModal && (
        <div
          className="bus-modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div className="bus-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bus-modal-header">
              <h2>Thêm Xe Bus Mới</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <div className="bus-modal-body">
              <div className="bus-modal-image">
                <img src="/image/bus.png" alt="Bus" />
              </div>

              <div className="bus-modal-info">
                <div className="edit-field">
                  <label>
                    Biến số: <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 59A-400000"
                    value={newBusData.licensePlate}
                    onChange={(e) =>
                      setNewBusData({
                        ...newBusData,
                        licensePlate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="edit-field">
                  <label>
                    Hãng: <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: toyota"
                    value={newBusData.manufacturer}
                    onChange={(e) =>
                      setNewBusData({
                        ...newBusData,
                        manufacturer: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="edit-field">
                  <label>
                    Lịch bảo dưỡng: <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    value={newBusData.maintenanceDate}
                    onChange={(e) =>
                      setNewBusData({
                        ...newBusData,
                        maintenanceDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="edit-field">
                  <label>
                    Số chỗ ngồi: <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 40"
                    value={newBusData.seats}
                    onChange={(e) =>
                      setNewBusData({
                        ...newBusData,
                        seats: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="edit-field">
                  <label>
                    Năm sản xuất: <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 2024"
                    value={newBusData.yearManufactured}
                    onChange={(e) =>
                      setNewBusData({
                        ...newBusData,
                        yearManufactured: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="info-note">
                  <p>
                    📌 <strong>Lưu ý:</strong>
                  </p>
                  <ul>
                    <li>
                      Quãng đường đã chạy: <strong>0 km</strong>
                    </li>
                    <li>
                      Trạng thái: <strong>Ngừng hoạt động</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bus-modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowAddModal(false)}
              >
                Hủy
              </button>
              <button className="btn-save" onClick={handleSaveNewBus}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Vị Trí */}
      {showLocationModal && selectedBus && (
        <div
          className="bus-modal-overlay"
          onClick={() => {
            setShowLocationModal(false);
            setRoutePath([]);
            setBusPos(null);
          }}
        >
          <div
            className="bus-modal bus-location-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bus-modal-header">
              <h2>Vị trí xe {selectedBus.licensePlate}</h2>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setShowLocationModal(false);
                  setRoutePath([]);
                  setBusPos(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="bus-modal-body bus-location-body">
              {/* Thông tin xe bên trái */}
              <div className="bus-location-info">
                <div className="bus-info-card">
                  <div className="info-card-header">
                    <span className="info-icon">🚌</span>
                    <h3>Thông tin xe</h3>
                  </div>
                  <div className="info-card-body">
                    <div className="info-item">
                      <span className="label">Biển số:</span>
                      <span className="value">{selectedBus.licensePlate}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Tuyến đường:</span>
                      <span className="value">{selectedBus.route}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Trạng thái:</span>
                      <span className="value status-active">
                        {selectedBus.status}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Hãng:</span>
                      <span className="value">{selectedBus.manufacturer}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Số chỗ:</span>
                      <span className="value">{selectedBus.seats} chỗ</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Năm SX:</span>
                      <span className="value">
                        {selectedBus.yearManufactured}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Quãng đường:</span>
                      <span className="value">
                        {selectedBus.distanceTraveled} km
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bus-status-indicator">
                  <div className="status-icon-moving">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                    </svg>
                  </div>
                  <div className="status-text">
                    <p className="status-title">Đang di chuyển</p>
                    <p className="status-subtitle">Xe đang chạy trên tuyến</p>
                  </div>
                </div>
              </div>

              {/* Bản đồ bên phải */}
              <div className="bus-location-map">
                {routePath.length > 0 && (
                  <MapContainer
                    center={routePath[0]}
                    zoom={14}
                    style={{
                      height: "100%",
                      width: "100%",
                      borderRadius: "8px",
                    }}
                  >
                    <MapController mapRefCallback={mapRef} bounds={routePath} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Route polyline */}
                    {routePath.length > 1 && (
                      <Polyline
                        positions={routePath}
                        color="#3b82f6"
                        weight={5}
                        opacity={0.8}
                      />
                    )}

                    {/* Marker điểm bắt đầu */}
                    {stations.length > 0 && stations[0].position && (
                      <Marker position={stations[0].position} icon={startIcon}>
                        <Popup>
                          <div>
                            <strong>Điểm khởi hành</strong>
                            <br />
                            {stations[0].name || stations[0].ten_diem}
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Marker điểm kết thúc */}
                    {stations.length > 0 &&
                      stations[stations.length - 1].position && (
                        <Marker
                          position={stations[stations.length - 1].position}
                          icon={endIcon}
                        >
                          <Popup>
                            <div>
                              <strong>Trường học</strong>
                              <br />
                              {stations[stations.length - 1].name ||
                                stations[stations.length - 1].ten_diem}
                            </div>
                          </Popup>
                        </Marker>
                      )}

                    {/* Real-time bus location marker */}
                    {busPos && (
                      <Marker
                        position={[busPos.latitude, busPos.longitude]}
                        icon={busIcon}
                      >
                        <Popup>
                          <div style={{ textAlign: "center" }}>
                            <strong>🚌 Xe: {selectedBus.licensePlate}</strong>
                            <br />
                            <small>
                              {busPos.latitude.toFixed(5)},{" "}
                              {busPos.longitude.toFixed(5)}
                            </small>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                )}
                {routePath.length === 0 && (
                  <div className="map-loading">
                    <p>Đang tải bản đồ...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
