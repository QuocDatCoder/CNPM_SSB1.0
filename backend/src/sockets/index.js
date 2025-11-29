const trackingHandler = require("./tracking.handler");
const scheduleHandler = require("./schedule.handler");
const notificationHandler = require('./notification.handler');
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Gắn handler cho tracking
    trackingHandler(io, socket);

    // Gắn handler cho schedule (real-time phân công)
    scheduleHandler(io, socket);

    notificationHandler(io, socket);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
