import React, { useState } from "react";
import Sidebar from "./components/common/Sidebar/Sidebar";
import Dashboard from "./pages/admin/Dashboard";
import Bus from "./pages/admin/Bus";
import Drivers from "./pages/admin/Drivers";
import Schedule from "./pages/admin/Schedule";
import Student from "./pages/admin/Student";
import Message from "./pages/admin/Message";
import RouteManagement from "./pages/admin/RouteManagement";
import Statistical from "./pages/admin/Statistical";
import DriverDashboard from "./pages/driver/Dashboard";
import "./index.css";

export default function App() {
  const [page, setPage] = useState("Trang chủ");

  function renderPage() {
    switch (page) {
      case "Xe buýt":
        return <Bus />;
      case "Tài xế":
        return <Drivers />;
      case "Tuyến đường":
        return <RouteManagement />;
      case "Lịch trình":
        return <Schedule />;
      case "Học sinh":
        return <Student />;
      case "Tin nhắn":
        return <Message />;
      case "Thống kê":
        return <Statistical />;
      case "Trang chủ":
      default:
        return <Dashboard />;
    }
  }

  return (() => {
    const role = import.meta.env.VITE_DEFAULT_PAGE || "admin";
    if (role === "driver") {
      return <DriverDashboard />;
    }

    return (
      <div className="app-container">
        <Sidebar active={page} onSelect={(label) => setPage(label)} />
        {renderPage()}
      </div>
    );
  })();
}
