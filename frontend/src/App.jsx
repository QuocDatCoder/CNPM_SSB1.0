import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./components/login/login";
import AdminLayout from "./layouts/AdminLayout";
import DriverLayout from "./layouts/DriverLayout";
import ParentLayout from "./layouts/ParentLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

// Component để redirect tự động dựa trên role
function RootRedirect() {
  const userStr = sessionStorage.getItem("user");

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const role = user.vai_tro;

      switch (role) {
        case "admin":
          return <Navigate to="/admin" replace />;
        case "taixe":
          return <Navigate to="/driver" replace />;
        case "phuhuynh":
          return <Navigate to="/parent" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      return <Navigate to="/login" replace />;
    }
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root dựa trên role đã login */}
        <Route path="/" element={<RootRedirect />} />

        {/* Trang đăng nhập - Route công khai */}
        <Route path="/login" element={<LoginPage />} />

        {/* Route cho Admin - Yêu cầu vai trò 'admin' */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* Route cho Tài xế - Yêu cầu vai trò 'taixe' */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRoles="taixe">
              <DriverLayout />
            </ProtectedRoute>
          }
        />

        {/* Route cho Phụ huynh - Yêu cầu vai trò 'phuhuynh' */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles="phuhuynh">
              <ParentLayout />
            </ProtectedRoute>
          }
        />

        {/* Redirect tất cả route không tồn tại về trang đăng nhập */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
