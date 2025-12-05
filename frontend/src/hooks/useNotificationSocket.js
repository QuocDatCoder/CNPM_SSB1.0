import { useEffect, useRef } from "react";
import io from "socket.io-client";

// Biến global để giữ singleton connection (tránh tạo nhiều socket cho cùng 1 client)
let globalSocket = null;

const useNotificationSocket = (userId, onNewNotification) => {
  // Dùng ref để giữ callback mới nhất
  const callbackRef = useRef(onNewNotification);

  useEffect(() => {
    callbackRef.current = onNewNotification;
  }, [onNewNotification]);

  useEffect(() => {
    if (!userId) return;

    // 1. Nếu chưa có socket toàn cục, tạo mới
    if (!globalSocket) {
      console.log("🔌 Creating NEW Global Socket Connection...");
      globalSocket = io("http://localhost:8080", {
        auth: { token: sessionStorage.getItem("token") },
        reconnection: true,
        reconnectionAttempts: 5,
        transports: ["websocket"], // Ép dùng websocket để ổn định hơn polling
      });

      globalSocket.on("connect", () => {
        console.log("✅ Socket Connected:", globalSocket.id);
        // Join room ngay khi connect
        globalSocket.emit("join-notification-room", { userId });
      });

      globalSocket.on("disconnect", (reason) => {
        console.warn("❌ Socket Disconnected:", reason);
      });
    }

    // 2. Nếu socket đã có nhưng bị mất kết nối, thử join lại
    if (globalSocket.connected) {
       globalSocket.emit("join-notification-room", { userId });
    }

    // 3. Đăng ký lắng nghe sự kiện cho component hiện tại
    const handleNotification = (response) => {
      console.log("📩 Event Received:", response);
      if (callbackRef.current) {
        callbackRef.current(response.data);
      }
    };

    // Remove listener cũ trước khi thêm mới để tránh double log
    globalSocket.off("new-notification", handleNotification);
    globalSocket.on("new-notification", handleNotification);

    // Cleanup: CHỈ remove listener, KHÔNG disconnect socket (để các component khác dùng chung)
    return () => {
      if (globalSocket) {
        globalSocket.off("new-notification", handleNotification);
      }
    };
  }, [userId]);
};

export default useNotificationSocket;