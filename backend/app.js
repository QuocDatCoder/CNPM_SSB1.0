// --- 1. Import các gói cần thiết ---
require('dotenv').config(); // Phải ở trên cùng để tải .env
const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // (Dùng để log các request API ra console)

// --- 2. Import "Ổ cắm" Database ---
// (Dòng này sẽ tự động chạy file db.config.js và in ra "Kết nối thành công!")
require('./src/config/db.config.js');

// --- 3. Khởi tạo ứng dụng Express ---
const app = express();

// --- 4. Cấu hình Middlewares (Các tầng xử lý chung) ---
// Cho phép Frontend ở domain khác gọi vào (ví dụ: localhost:5173)
app.use(cors());

// Giúp Express đọc được body gửi lên dạng JSON
app.use(express.json());

// Log request (ví dụ: "GET /api/schedules 200 OK")
app.use(morgan('dev'));

// --- 5. Cấu hình Routes (Đường dẫn API) ---
// API test
app.get('/', (req, res) => {
  res.json({ message: 'Chào mừng đến với server SSB1.0!' });
});

/* ĐÂY LÀ NƠI CÁC BE SẼ GẮN ROUTES CỦA MÌNH VÀO
  (Chúng ta sẽ làm việc này sau khi code xong routes)
*/




module.exports = app;