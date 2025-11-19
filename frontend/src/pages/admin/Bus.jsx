import React, { useState } from "react";
import Header from "../../components/common/Header/header";
import "./Bus.css";

const busData = [
  {
    id: "001",
    image: "/image/bus.png",
    route: "..........",
    status: "active",
  },
  {
    id: "001",
    image: "/image/bus.png",
    route: "..........",
    status: "active",
  },
  {
    id: "001",
    image: "/image/bus.png",
    route: "..........",
    status: "active",
  },
  {
    id: "001",
    image: "/image/bus.png",
    route: "..........",
    status: "active",
  },
];

export default function Bus() {
  const [buses, setBuses] = useState(busData);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEdit = (id) => {
    console.log("Edit bus:", id);
  };

  const handleDelete = (id) => {
    console.log("Delete bus:", id);
  };

  const handleAdd = () => {
    console.log("Add new bus");
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
            <div className="bus-card" key={index}>
              <div className="bus-image-container">
                <img src={bus.image} alt="Bus" className="bus-image" />
              </div>
              <div className="bus-info">
                <div className="bus-details">
                  <p className="bus-id">Mã : {bus.id}</p>
                  <p className="bus-route">Tuyến đường: {bus.route}</p>
                  <p className="bus-status">Trạng thái:</p>
                </div>
                <div className="bus-actions">
                  <div>
                    <button
                      className="action-btn-bus view-btn-bus"
                      onClick={() => handleEdit(bus.id)}
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
                        onClick={() => handleEdit(bus.id)}
                        title="Chỉnh sửa"
                      >
                        <img src="/icons/edit.png" alt="Edit" />
                      </button>
                    </div>
                    <div className="delete-btn-container">
                      <button
                        className="action-btn-bus delete-btn-bus"
                        onClick={() => handleDelete(bus.id)}
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
    </div>
  );
}
