import React from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";

/**
 * Component bảo vệ route, yêu cầu đăng nhập và vai trò phù hợp
 * @param {Object} props
 * @param {React.Component} props.children - Component con cần bảo vệ
 * @param {string|string[]} props.allowedRoles - Vai trò được phép truy cập
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  const userRole = AuthService.getUserRole();

  // Debug: Log để kiểm tra trạng thái
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
  console.log("ProtectedRoute - userRole:", userRole);
  console.log("ProtectedRoute - allowedRoles:", allowedRoles);
  console.log("ProtectedRoute - token:", sessionStorage.getItem("token"));
  console.log("ProtectedRoute - user:", sessionStorage.getItem("user"));

  if (!isAuthenticated) {
    // Chưa đăng nhập -> chuyển về trang login
    console.log("ProtectedRoute - Redirecting to login: Not authenticated");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(userRole)) {
      // Vai trò không phù hợp -> chuyển về trang login
      console.log("ProtectedRoute - Redirecting to login: Role mismatch");
      return <Navigate to="/login" replace />;
    }
  }

  console.log("ProtectedRoute - Access granted");
  return children;
};

export default ProtectedRoute;
