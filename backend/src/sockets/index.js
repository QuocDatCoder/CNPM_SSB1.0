const trackingHandler = require('./tracking.handler');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

     // Gắn handler cho tracking
    trackingHandler(io, socket);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
