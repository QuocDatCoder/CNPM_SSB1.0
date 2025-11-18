import React, { useState } from "react";
import Sidebar from "./components/common/Sidebar/Sidebar";
import Dashboard from "./pages/admin/Dashboard";
import Drivers from "./pages/admin/Drivers";
import "./index.css";

export default function App() {
  const [page, setPage] = useState("Trang chủ");

  function renderPage() {
    switch (page) {
      case "Tài xế":
        return <Drivers />;
      case "Trang chủ":
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="app-container">
      <Sidebar active={page} onSelect={(label) => setPage(label)} />
      {renderPage()}
    </div>
  );
}
