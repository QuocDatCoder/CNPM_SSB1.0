const http = require('http');
const app = require('./app'); // <--- DÒNG NÀY QUAN TRỌNG NHẤT

const { Server } = require('socket.io');
const socketIndex = require('./src/sockets/index.js');

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

// Khởi tạo socket.io
const io = new Server(server, { cors: { origin: '*' } });
global.io = io; // để service có thể emit sự kiện

// Gắn socket handler
socketIndex(io);

server.listen(PORT, () => {
  console.log(`Server dang chay tai http://localhost:${PORT}`);
});