import React, { useState } from "react";
import Header from "../../components/common/Header/header";
import "./Bus.css";
import busesData from "../../data/buses";

export default function Bus() {
  const [buses, setBuses] = useState(busesData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newBusData, setNewBusData] = useState({
    licensePlate: "",
    manufacturer: "",
    seats: "",
    yearManufactured: "",
    maintenanceDate: "",
  });

  const handleViewDetail = (bus) => {
    setSelectedBus(bus);
    setShowDetailModal(true);
  };

  const handleEdit = (e, bus) => {
    e.stopPropagation();
    setSelectedBus(bus);
    setEditFormData({ ...bus });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    setBuses(
      buses.map((bus) => (bus.id === editFormData.id ? editFormData : bus))
    );
    setShowEditModal(false);
    alert("Đã cập nhật thông tin xe buýt!");
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa xe buýt này?")) {
      setBuses(buses.filter((bus) => bus.id !== id));
      alert("Đã xóa xe buýt!");
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

  const handleSaveNewBus = () => {
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

    const newBus = {
      id: String(buses.length + 1).padStart(3, "0"),
      licensePlate: newBusData.licensePlate,
      manufacturer: newBusData.manufacturer,
      seats: parseInt(newBusData.seats),
      yearManufactured: parseInt(newBusData.yearManufactured),
      distanceTraveled: 0,
      maintenanceDate: newBusData.maintenanceDate,
      status: "ngừng hoạt động",
      route: "Chưa phân tuyến",
      image: "/image/bus.png",
    };

    setBuses([...buses, newBus]);
    setShowAddModal(false);
    alert("Đã thêm xe buýt mới!");
  };

  const filteredBuses = buses.filter(
    (bus) =>
      bus.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                      className="action-btn-bus view-btn-bus"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetail(bus);
                      }}
                      title="Xem vị trí"
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
                    <option value="đang hoạt động">Đang hoạt động</option>
                    <option value="bảo trì">Bảo trì</option>
                    <option value="ngừng hoạt động">Ngừng hoạt động</option>
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
    </div>
  );
}
