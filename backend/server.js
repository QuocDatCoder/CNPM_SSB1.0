const http = require('http');
const app = require('./app'); // <--- DÒNG NÀY QUAN TRỌNG NHẤT

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server dang chay tai http://localhost:${PORT}`);
});