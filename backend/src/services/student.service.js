const {
  Student,
  User,
  RouteStop,
  Stop,
  Route,
  ScheduleStudent,
  Schedule,
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
          as: "defaultRouteStopDi",
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
        {
          model: RouteStop,
          as: "defaultRouteStopVe",
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
      const routeStopDi = student.defaultRouteStopDi || {};
      const stopDi = routeStopDi.Stop || {};
      const routeDi = routeStopDi.Route || {};
      const routeStopVe = student.defaultRouteStopVe || {};
      const stopVe = routeStopVe.Stop || {};
      const routeVe = routeStopVe.Route || {};

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

        // Thông tin Lượt đi (Sáng)
        tram_don_di: stopDi.ten_diem || "Chưa đăng ký",
        dia_chi_tram_di: stopDi.dia_chi || "",
        tuyen_duong_di: routeDi.ten_tuyen || "Chưa đăng ký",
        default_route_stop_id_di: student.default_route_stop_id_di,

        // Thông tin Lượt về (Chiều)
        tram_don_ve: stopVe.ten_diem || "Chưa đăng ký",
        dia_chi_tram_ve: stopVe.dia_chi || "",
        tuyen_duong_ve: routeVe.ten_tuyen || "Chưa đăng ký",
        default_route_stop_id_ve: student.default_route_stop_id_ve,
      };
    });
  } catch (error) {
    console.error("Lỗi getAllStudents:", error);
    throw error;
  }
};
const autoAssignToSchedule = async (
  studentId,
  routeStopIdDi,
  routeStopIdVe,
  transaction
) => {
  try {
    // Assign both directions if provided
    const routeStops = [];
    if (routeStopIdDi) routeStops.push(routeStopIdDi);
    if (routeStopIdVe) routeStops.push(routeStopIdVe);

    if (routeStops.length === 0) {
      console.warn(`Không có RouteStop để gán cho student ${studentId}`);
      return;
    }

    // Lấy Route ID từ RouteStops
    const routeStopRecords = await RouteStop.findAll({
      where: { id: { [Op.in]: routeStops } },
      transaction,
    });

    if (routeStopRecords.length === 0) {
      console.warn(`Không tìm thấy RouteStop records`);
      return;
    }

    // Group by route_id
    const routeMap = {};
    routeStopRecords.forEach((rs) => {
      if (!routeMap[rs.route_id]) routeMap[rs.route_id] = rs.stop_id;
    });

    // 2. Tìm các lịch trình phù hợp cho mỗi route
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Gán cho tất cả schedules của các route
    for (const [routeId, stopId] of Object.entries(routeMap)) {
      const schedules = await Schedule.findAll({
        where: {
          route_id: parseInt(routeId),
          ngay_chay: { [Op.gte]: today },
          trang_thai: { [Op.ne]: "hoanthanh" },
        },
        transaction,
      });

      // 3. Gán học sinh vào từng lịch trình
      for (const schedule of schedules) {
        await ScheduleStudent.findOrCreate({
          where: {
            schedule_id: schedule.id,
            student_id: studentId,
          },
          defaults: {
            stop_id: parseInt(stopId),
            trang_thai_don: "choxacnhan",
          },
          transaction,
        });
      }
    }
  } catch (error) {
    console.error("Lỗi tự động gán lịch trình:", error);
  }
};

// 3. Tạo Học sinh KÈM Phụ huynh (Logic thông minh có transaction)
const createStudentWithParent = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    let parentId = null;
    let parent = null;

    // --- BƯỚC 1: XỬ LÝ PHỤ HUYNH ---
    const existingParent = await User.findOne({
      where: { so_dien_thoai: data.sdt_ph },
      transaction,
    });

    if (existingParent) {
      parent = existingParent;
      parentId = existingParent.id;
    } else {
      parent = await User.create(
        {
          username: data.username || data.sdt_ph,
          email: data.email_ph,
          password_hash: data.password || "$2b$10$...", // hash thực tế
          ho_ten: data.ho_ten_ph,
          so_dien_thoai: data.sdt_ph,
          dia_chi: data.dia_chi,
          vai_tro: "phuhuynh",
        },
        { transaction }
      );
      parentId = parent.id;
    }

    // --- BƯỚC 2: LẤY routeStopIds (cả lượt đi và lượt về) ---
    let routeStopIdDi = null;
    let routeStopIdVe = null;

    if (data.route_id_di && data.stop_id_di) {
      const routeStop = await RouteStop.findOne({
        where: { route_id: data.route_id_di, stop_id: data.stop_id_di },
        transaction,
      });
      if (routeStop) routeStopIdDi = routeStop.id;
    }

    if (data.route_id_ve && data.stop_id_ve) {
      const routeStop = await RouteStop.findOne({
        where: { route_id: data.route_id_ve, stop_id: data.stop_id_ve },
        transaction,
      });
      if (routeStop) routeStopIdVe = routeStop.id;
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
        default_route_stop_id_di: routeStopIdDi,
        default_route_stop_id_ve: routeStopIdVe,
      },
      { transaction }
    );

    // --- BƯỚC 4: TỰ ĐỘNG GÁN VÀO LỊCH TRÌNH ---
    if (routeStopIdDi || routeStopIdVe) {
      await autoAssignToSchedule(
        student.id,
        routeStopIdDi,
        routeStopIdVe,
        transaction
      );
    }

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

    // Xử lý route và stop - dual directions
    if (data.route_id_di !== undefined && data.stop_id_di !== undefined) {
      const routeStop = await RouteStop.findOne({
        where: {
          route_id: data.route_id_di,
          stop_id: data.stop_id_di,
        },
      });
      studentData.default_route_stop_id_di = routeStop ? routeStop.id : null;
    }

    if (data.route_id_ve !== undefined && data.stop_id_ve !== undefined) {
      const routeStop = await RouteStop.findOne({
        where: {
          route_id: data.route_id_ve,
          stop_id: data.stop_id_ve,
        },
      });
      studentData.default_route_stop_id_ve = routeStop ? routeStop.id : null;
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
