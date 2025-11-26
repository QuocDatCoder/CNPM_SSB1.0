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
import Header from "../../components/common/Header/header";
import "./Bus.css";
import BusService from "../../services/bus.service";
import RouteService from "../../services/route.service";

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

export default function Bus() {
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
        RouteService.getAllRoutes(),
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

    // Tìm route tương ứng với xe - so sánh tên tuyến
    const busRoute = routes.find((route) => {
      // bus.route là tên tuyến từ DB (VD: "Tuyến 1: Q1 - Q5")
      // route.name là tên từ RouteService (VD: "Tuyến 1: Q1 - Q5")
      return bus.route && route.name && bus.route.includes(route.name);
    });

    if (!busRoute) {
      console.log("Bus route:", bus.route);
      console.log(
        "Available routes:",
        routes.map((r) => r.name)
      );
      alert(
        `Không tìm thấy tuyến đường cho xe này! Tuyến: ${
          bus.route || "Chưa phân tuyến"
        }`
      );
      return;
    }

    // Fetch route từ OSRM
    const path = await fetchRoute(busRoute.start, busRoute.end);
    setRoutePath(path);

    if (path.length > 0) {
      setBusPos(path[0]);
    }

    setShowLocationModal(true);
  };

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

  // Animation di chuyển xe
  useEffect(() => {
    if (routePath.length === 0 || !showLocationModal) return;

    let index = 0;

    const interval = setInterval(() => {
      index++;
      if (index >= routePath.length) index = 0;

      setBusPos(routePath[index]);
    }, 200);

    return () => clearInterval(interval);
  }, [routePath, showLocationModal]);

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
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Vẽ tuyến đường */}
                    <Polyline
                      positions={routePath}
                      color="#3b82f6"
                      weight={5}
                      opacity={0.8}
                    />

                    {/* Marker điểm bắt đầu */}
                    <Marker position={routePath[0]} icon={startIcon}>
                      <Popup>Điểm bắt đầu</Popup>
                    </Marker>

                    {/* Marker điểm kết thúc */}
                    <Marker
                      position={routePath[routePath.length - 1]}
                      icon={endIcon}
                    >
                      <Popup>Điểm kết thúc</Popup>
                    </Marker>

                    {/* Marker xe di chuyển */}
                    {busPos && (
                      <Marker position={busPos} icon={busIcon}>
                        <Popup>
                          <strong>{selectedBus.licensePlate}</strong>
                          <br />
                          {selectedBus.route}
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
