import React, { useState } from "react";
import Header from "../../components/common/Header/header";
import "./RouteManagement.css";

const routeData = [
  {
    id: "001",
    name: "Tuyến số 1",
    distance: "5km",
    duration: "20 phút",
    stations: "6 trạm",
    start: "Dh Sài gòn",
    end: "Đinh Độc Lập",
    mapImage: "/image/map-route.png",
  },
  {
    id: "001",
    name: "Tuyến số 1",
    distance: "5km",
    duration: "20 phút",
    stations: "6 trạm",
    start: "Dh Sài gòn",
    end: "Đinh Độc Lập",
    mapImage: "/image/map-route.png",
  },
  {
    id: "001",
    name: "Tuyến số 1",
    distance: "5km",
    duration: "20 phút",
    stations: "6 trạm",
    start: "Dh Sài gòn",
    end: "Đinh Độc Lập",
    mapImage: "/image/map-route.png",
  },
  {
    id: "001",
    name: "Tuyến số 1",
    distance: "5km",
    duration: "20 phút",
    stations: "6 trạm",
    start: "Dh Sài gòn",
    end: "Đinh Độc Lập",
    mapImage: "/image/map-route.png",
  },
];

export default function RouteManagement() {
  const [routes, setRoutes] = useState(routeData);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEdit = (id) => {
    console.log("Edit route:", id);
  };

  const handleDelete = (id) => {
    console.log("Delete route:", id);
  };

  const handleViewRoute = (id) => {
    console.log("View route:", id);
  };

  const handleAdd = () => {
    console.log("Add new route");
  };

  const filteredRoutes = routes.filter(
    (route) =>
      route.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="route-page">
      <Header title="Tuyến đường" />

      <div className="route-content">
        <div className="route-grid">
          {filteredRoutes.map((route, index) => (
            <div className="route-card" key={index}>
              <div className="route-map-container">
                <img src={route.mapImage} alt="Map" className="route-map" />
              </div>
              <div className="route-info">
                <div className="route-details">
                  <p className="route-id">Mã : {route.id}</p>
                  <p className="route-distance">Độ dài: {route.distance}</p>
                  <p className="route-duration">
                    Thời gian dự định: {route.duration}
                  </p>
                  <p className="route-stations">Số trạm: {route.stations}</p>
                  <p className="route-endpoints">
                    Điểm đầu/ cuối: {route.start},{route.end}
                  </p>
                </div>
                <div className="route-actions">
                  <div className="route-view-btn-container">
                    <button
                      className="route-action-btn route-view-btn"
                      onClick={() => handleViewRoute(route.id)}
                      title="Xem tuyến"
                    >
                      <span className="route-icon">📍</span>
                      Xem tuyến
                    </button>
                  </div>

                  <div className="route-edit-delete-btn">
                    <div className="route-edit-btn-container">
                      <button
                        className="route-action-btn route-edit-btn"
                        onClick={() => handleEdit(route.id)}
                        title="Chỉnh sửa"
                      >
                        <img src="/icons/edit.png" alt="Edit" />
                      </button>
                    </div>
                    <div className="route-delete-btn-container">
                      <button
                        className="route-action-btn route-delete-btn"
                        onClick={() => handleDelete(route.id)}
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
          className="route-add-btn"
          onClick={handleAdd}
          title="Thêm tuyến đường mới"
        >
          <span className="route-plus-icon">+</span>
        </button>
      </div>
    </div>
  );
}
