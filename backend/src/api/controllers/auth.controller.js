const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../data/models/user.model");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h";

/**
 * @desc    Đăng nhập
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên đăng nhập và mật khẩu",
      });
    }

    // Tìm user theo username hoặc email
    const user = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [
          { username: username },
          { email: username },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
      });
    }

    // Kiểm tra mật khẩu
    // Nếu password trong DB chưa được hash (như seed data '123456'), so sánh trực tiếp
    let isPasswordValid = false;

    if (
      user.password_hash.startsWith("$2a$") ||
      user.password_hash.startsWith("$2b$")
    ) {
      // Password đã được hash bằng bcrypt
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Password chưa hash (seed data), so sánh trực tiếp
      isPasswordValid = password === user.password_hash;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        vai_tro: user.vai_tro,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Trả về thông tin user và token
    res.json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          ho_ten: user.ho_ten,
          vai_tro: user.vai_tro,
          so_dien_thoai: user.so_dien_thoai,
          dia_chi: user.dia_chi,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng nhập",
      error: error.message,
    });
  }
};

/**
 * @desc    Lấy thông tin user hiện tại từ token
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
