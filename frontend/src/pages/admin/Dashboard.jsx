import React from "react";
import "./Dashboard.css";

const routes = [
  { id: 1, name: "Tuyến 1", street: "An Dương Vương", time: "4:00–6:00" },
  { id: 2, name: "Tuyến 2", street: "Lê Lợi", time: "6:00–8:00" },
  { id: 3, name: "Tuyến 3", street: "Trường Chinh", time: "7:00–9:00" },
  { id: 4, name: "Tuyến 4", street: "Nguyễn Văn Linh", time: "9:00–11:00" },
];

export default function Dashboard() {
  return (
    <div className="dashboard">
      <div className="banner">
        <div className="search">
          <input type="text" placeholder="Tìm kiếm..." />
          <button>Đăng nhập</button>
        </div>
        <div className="routes-container">
          {routes.map((r) => (
            <div className="route-card" key={r.id}>
              <img src="/icons/bus.png" alt="Bus" />
              <h3>{r.name}</h3>
              <p>Đường: {r.street}</p>
              <p>{r.time}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="map-section">
        <iframe
          title="map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4827441472476!2d106.65843057573807!3d10.77653048937026!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f40e7a7a0b3%3A0xdee7c2c2b8cddc0a!2zVGjhuqFpIEjhu41jIE3hu5l0LCBI4buTIENow60gTWluaCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1698189234621!5m2!1svi!2s"
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}
