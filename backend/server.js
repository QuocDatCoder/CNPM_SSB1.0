// Tải các biến .env (luôn ở dòng đầu)
require('dotenv').config();

// Tạm thời chỉ cần 'express' để chạy server
const express = require('express');
const app = express();

// Lấy PORT từ file .env, nếu không có thì mặc định là 8080
const PORT = process.env.PORT || 8080;

// Tạo một API test
app.get('/', (req, res) => {
  res.send('Hello, SSB1.0 Backend Server!');
});

// Lắng nghe ở port
app.listen(PORT, () => {
  console.log(`Server dang chay tai http://localhost:${PORT}`);
});