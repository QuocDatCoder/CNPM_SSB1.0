const jwt = require('jsonwebtoken');

// Middleware xác thực JWT
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: '❌ Không có token, vui lòng đăng nhập!' });
  }

  try {
    // Giải mã token
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decoded; // gắn thông tin user vào request
    next();
  } catch (err) {
    return res.status(401).json({ message: '❌ Token không hợp lệ!' });
  }
}

// Middleware kiểm tra role = driver
function isDriver(req, res, next) {
  if (req.user && req.user.vai_tro === 'taixe') {
    return next();
  }
  return res.status(403).json({ message: '❌ Chỉ tài xế mới được phép truy cập!' });
}

// Middleware kiểm tra role = admin
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: '❌ Chỉ admin mới được phép truy cập!' });
}

// Middleware xử lý lỗi chung
function errorHandler(err, req, res, next) {
  console.error('❌ Lỗi:', err.stack);
  res.status(500).json({ message: 'Có lỗi xảy ra trong server!' });
}

module.exports = {
  verifyToken,
  isDriver,
  isAdmin,
  errorHandler,
};
