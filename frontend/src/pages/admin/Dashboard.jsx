import React, { useState } from "react";
import "./Dashboard.css";

const routes = [
  {
    id: 1,
    name: "Tuyến 1",
    street: "Đường: An Dương Vương",
    time: "4:00–6:00",
  },
  {
    id: 2,
    name: "Tuyến 2",
    street: "Đường: An Dương Vương",
    time: "4:00–6:00",
  },
  {
    id: 3,
    name: "Tuyến 3",
    street: "Đường: An Dương Vương",
    time: "4:00–6:00",
  },
  {
    id: 4,
    name: "Tuyến 4",
    street: "Đường: An Dương Vương",
    time: "4:00–6:00",
  },
  { id: 5, name: "Tuyến 5", street: "Đường: Lê Lợi", time: "6:00–8:00" },
  { id: 6, name: "Tuyến 6", street: "Đường: Trường Chinh", time: "7:00–9:00" },
];

export default function Dashboard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 4;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(routes.length - itemsPerPage, prev + 1));
  };

  const visibleRoutes = routes.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <div className="dashboard">
      <div className="header">
        <div className="header-left">
          <h1>Trang chủ</h1>
        </div>
        <div className="header-right">
          <input type="text" placeholder="Tìm kiếm" className="search-input" />
          <button className="login-btn">Đăng nhập</button>
        </div>
      </div>

      <div className="banner">
        <button
          className="carousel-btn prev-btn"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          ‹
        </button>

        <div className="routes-container">
          {visibleRoutes.map((route) => (
            <div className="route-card" key={route.id}>
              <div className="route">
                <div className="route-icon">
                  <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                    <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
                  </svg>
                </div>
                <div className="route-name">
                  <h3>{route.name}</h3>
                </div>
              </div>

              <div className="infor-route">
                <p className="route-street">{route.street}</p>
                <p className="route-time">{route.time}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          className="carousel-btn next-btn"
          onClick={handleNext}
          disabled={currentIndex >= routes.length - itemsPerPage}
        >
          ›
        </button>
      </div>

      <div className="map-section">
        <iframe
          title="map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d501726.5286824077!2d106.41533104999999!3d10.754666449999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529292e8d3dd1%3A0xf15f5aad773c112b!2zSOG7kyBDaMOtIE1pbmgsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}
