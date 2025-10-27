import React from "react";
import Sidebar from "./components/common/Sidebar/Sidebar";
import Dashboard from "./pages/admin/Dashboard";
import "./index.css";

export default function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <Dashboard />
    </div>
  );
}
