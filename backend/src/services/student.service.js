const {
  Student,
  User,
  RouteStop,
  Stop,
  Route,
  sequelize,
} = require("../data/models");
const { Op } = require("sequelize");

// 1. Lấy danh sách học sinh
const getAllStudents = async () => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: User,
          as: "parent",
          attributes: [
            "id",
            "username",
            "password_hash",
            "ho_ten",
            "so_dien_thoai",
            "email",
            "dia_chi",
          ],
        },
        {
          model: RouteStop,
          as: "defaultRouteStop",
          include: [
            {
              model: Stop,
              as: "Stop",
              attributes: ["id", "ten_diem", "dia_chi"],
            },
            {
              model: Route,
              as: "Route",
              attributes: ["id", "ten_tuyen"],
            },
          ],
        },
      ],
      order: [["id", "DESC"]],
    });

    return students.map((student) => {
      const parent = student.parent || {};
      const routeStop = student.defaultRouteStop || {};
      const stop = routeStop.Stop || routeStop.stop || {};
      const route = routeStop.Route || routeStop.route || {};

      return {
        id: student.id,
        ho_ten: student.ho_ten,
        lop: student.lop,
        ngay_sinh: student.ngay_sinh,
        gioi_tinh: student.gioi_tinh,
        gvcn: student.gvcn,

        // Thông tin Phụ huynh
        parent_id: student.parent_id,
        username_phu_huynh: parent.username || "",
        password_phu_huynh: parent.password_hash || "",
        ten_phu_huynh: parent.ho_ten || "Chưa cập nhật",
        sdt_phu_huynh: parent.so_dien_thoai || "",
        email_phu_huynh: parent.email || "",
        dia_chi: parent.dia_chi || "",

        // Thông tin Tuyến/Trạm (Lấy từ RouteStop)
        tram_don: stop.ten_diem || "Chưa đăng ký",
        dia_chi_tram: stop.dia_chi || "",
        tuyen_duong: route.ten_tuyen || "Chưa đăng ký",

        default_route_stop_id: student.default_route_stop_id,
        current_route_id: route.id || null,
        current_stop_id: stop.id || null,
      };
    });
  } catch (error) {
    console.error("Lỗi getAllStudents:", error);
    throw error;
  }
};

// 2. Tạo Học sinh KÈM Phụ huynh
const createStudentWithParent = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    let parentId = null;
    let parent = null;

    // --- BƯỚC 1: XỬ LÝ PHỤ HUYNH ---
    // Kiểm tra xem SĐT này đã có tài khoản chưa (tránh trùng lặp)
    const existingParent = await User.findOne({
      where: { so_dien_thoai: data.sdt_ph },
    });

    if (existingParent) {
      parent = existingParent;
      parentId = existingParent.id;
    } else {
      // Tạo mới User vai trò phụ huynh
      parent = await User.create(
        {
          username: data.username || data.sdt_ph,
          email: data.email_ph,
          password_hash: data.password || "$2b$10$...",
          ho_ten: data.ho_ten_ph,
          so_dien_thoai: data.sdt_ph,
          dia_chi: data.dia_chi,
          vai_tro: "phuhuynh",
        },
        { transaction }
      );
      parentId = parent.id;
    }

    let routeStopId = null;
    if (data.route_id && data.stop_id) {
      const routeStop = await RouteStop.findOne({
        where: {
          route_id: data.route_id,
          stop_id: data.stop_id,
        },
      });
      if (routeStop) {
        routeStopId = routeStop.id;
      } else {
        console.warn(
          `Không tìm thấy RouteStop cho Route ${data.route_id} và Stop ${data.stop_id}`
        );
      }
    }

    // --- BƯỚC 3: TẠO HỌC SINH ---
    const student = await Student.create(
      {
        ho_ten: data.ho_ten_hs,
        lop: data.lop,
        ngay_sinh: data.ngay_sinh,
        gioi_tinh: data.gioi_tinh,
        gvcn: data.gvcn,
        parent_id: parentId,
        default_route_stop_id: routeStopId,
      },
      { transaction }
    );

    await transaction.commit();
    return { student, parent };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// 3. Sửa thông tin học sinh
const updateStudent = async (id, data) => {
  try {
    const student = await Student.findByPk(id, {
      include: [{ model: User, as: "parent" }],
    });
    if (!student) throw new Error("Học sinh không tồn tại");

    // Cập nhật thông tin phụ huynh nếu có
    if (student.parent_id) {
      const parentData = {};
      if (data.username_ph !== undefined)
        parentData.username = data.username_ph;
      if (data.ho_ten_ph !== undefined) parentData.ho_ten = data.ho_ten_ph;
      if (data.sdt_ph !== undefined) parentData.so_dien_thoai = data.sdt_ph;
      if (data.email_ph !== undefined) parentData.email = data.email_ph;
      if (data.dia_chi !== undefined) parentData.dia_chi = data.dia_chi;
      if (data.password !== undefined) parentData.password_hash = data.password;

      if (Object.keys(parentData).length > 0) {
        await User.update(parentData, {
          where: { id: student.parent_id },
        });
      }
    }

    // Cập nhật thông tin học sinh
    const studentData = {};
    if (data.ho_ten_hs !== undefined) studentData.ho_ten = data.ho_ten_hs;
    if (data.lop !== undefined) studentData.lop = data.lop;
    if (data.ngay_sinh !== undefined) studentData.ngay_sinh = data.ngay_sinh;
    if (data.gioi_tinh !== undefined) studentData.gioi_tinh = data.gioi_tinh;
    if (data.gvcn !== undefined) studentData.gvcn = data.gvcn;

    // Xử lý route và stop
    if (data.route_id !== undefined && data.stop_id !== undefined) {
      const routeStop = await RouteStop.findOne({
        where: {
          route_id: data.route_id,
          stop_id: data.stop_id,
        },
      });
      studentData.default_route_stop_id = routeStop ? routeStop.id : null;
    }

    await student.update(studentData);
    return student;
  } catch (error) {
    throw error;
  }
};

// 4. Xóa học sinh
const deleteStudent = async (id) => {
  try {
    const student = await Student.findByPk(id);
    if (!student) throw new Error("Học sinh không tồn tại");

    await student.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllStudents,
  createStudentWithParent,
  updateStudent,
  deleteStudent,
};
