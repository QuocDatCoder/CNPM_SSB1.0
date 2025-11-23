require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// 1. Load Models và biến sequelize từ file index.js
// (Lưu ý: phải có dấu ngoặc nhọn { sequelize })
const { sequelize } = require('./src/data/models'); 


// Nó sẽ quét các model và tạo bảng trong MySQL
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Database & tables synced! (Đã đồng bộ xong)');
  })
  .catch((err) => {
    console.error('❌ Lỗi đồng bộ Database:', err);
  });

// 3. Khởi tạo App
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 4. Routes
const routeRoutes = require('./src/api/routes/route.routes'); // Import
app.use('/api/routes', routeRoutes); // Kích hoạt: Mọi cái bắt đầu bằng /api/routes sẽ vào đây
const stopRoutes = require('./src/api/routes/stop.routes');
app.use('/api/stops', stopRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Server SSB1.0 đang chạy ổn định!' });
});

module.exports = app;