import { useEffect, useRef } from "react";
import io from "socket.io-client";

/**
 * Hook sử dụng WebSocket để nhận real-time schedule updates
 * @param {number} driverId - ID tài xế
 * @param {function} onScheduleAssigned - Callback khi có lịch mới được phân công
 * @param {function} onScheduleUpdated - Callback khi lịch được cập nhật
 * @param {function} onScheduleDeleted - Callback khi lịch bị xóa
 */
export const useDriverScheduleSocket = (
  driverId,
  onScheduleAssigned,
  onScheduleUpdated,
  onScheduleDeleted
) => {
  const socketRef = useRef(null);
  const connectedRef = useRef(false);
  const callbacksRef = useRef({
    onScheduleAssigned,
    onScheduleUpdated,
    onScheduleDeleted,
  });

  // Update callbacks khi chúng thay đổi
  useEffect(() => {
    callbacksRef.current = {
      onScheduleAssigned,
      onScheduleUpdated,
      onScheduleDeleted,
    };
  }, [onScheduleAssigned, onScheduleUpdated, onScheduleDeleted]);

  useEffect(() => {
    if (!driverId) return;

    // Nếu đã connect rồi, không tạo socket mới
    if (socketRef.current && connectedRef.current) {
      console.log("🔄 Socket already connected, skipping reconnect");
      return;
    }

    console.log("🔌 Creating new WebSocket connection for driver:", driverId);

    // Kết nối đến WebSocket server
    const socket = io("http://localhost:8080", {
      auth: {
        token: sessionStorage.getItem("token"),
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket:", socket.id);
      connectedRef.current = true;

      // Join driver room
      socket.emit("join-driver-room", { driverId });
    });

    // Event: Lịch mới được phân công
    socket.on("schedule-assigned", (data) => {
      console.log("📢 New schedule assigned:", data);
      if (callbacksRef.current.onScheduleAssigned) {
        callbacksRef.current.onScheduleAssigned(data);
      }
    });

    // Event: Lịch được cập nhật
    socket.on("schedule-updated", (data) => {
      console.log("📝 Socket received schedule-updated:", data);
      console.log(
        "📝 Callback onScheduleUpdated exists:",
        !!callbacksRef.current.onScheduleUpdated
      );
      if (callbacksRef.current.onScheduleUpdated) {
        callbacksRef.current.onScheduleUpdated(data);
      }
    });

    // Event: Lịch bị xóa
    socket.on("schedule-deleted", (data) => {
      console.log("🗑️ Socket received schedule-deleted:", data);
      console.log(
        "🗑️ Callback onScheduleDeleted exists:",
        !!callbacksRef.current.onScheduleDeleted
      );
      if (callbacksRef.current.onScheduleDeleted) {
        callbacksRef.current.onScheduleDeleted(data);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket");
      connectedRef.current = false;
    });

    socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      connectedRef.current = false;
    });

    return () => {
      if (socket && connectedRef.current) {
        socket.emit("leave-driver-room", { driverId });
        socket.disconnect();
        connectedRef.current = false;
      }
    };
  }, [driverId]);
};

export default useDriverScheduleSocket;
