const {
  Schedule,
  Bus,
  Route,
  User,
  AssignmentHistory,
  RouteStop,
  Stop,
} = require("../data/models");
const { Op } = require("sequelize");

// --- HÀM PHỤ TRỢ (HELPER) ---

// 1. Tính giờ kết thúc
const calculateEndTime = (startTime, durationMinutes) => {
  if (!startTime) return "00:00";
  const [hour, minute] = startTime.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0);
  date.setMinutes(date.getMinutes() + (durationMinutes || 0));
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

// 2. Lấy điểm đầu và điểm cuối
const getStartEndLocation = async (routeId) => {
  const routeStops = await RouteStop.findAll({
    where: { route_id: routeId },
    include: [{ model: Stop, attributes: ["ten_diem"] }],
    order: [["thu_tu", "ASC"]],
  });

  if (!routeStops || routeStops.length < 2) return { start: "N/A", end: "N/A" };

  return {
    start: routeStops[0].Stop.ten_diem,
    end: routeStops[routeStops.length - 1].Stop.ten_diem,
  };
};

// --- MAIN FUNCTIONS (API LOGIC) ---

// 1. Lấy danh sách lịch trình (Cho Admin Dashboard - Table View)
const getAllSchedules = async () => {
  try {
    const schedules = await Schedule.findAll({
      include: [
        {
          model: Route,
          attributes: ["id", "ten_tuyen", "mo_ta", "loai_tuyen"],
        },
        {
          model: User,
          as: "driver",
          attributes: ["driver_code", "ho_ten", "so_dien_thoai"],
        }, // Lưu ý: as 'Driver' phải khớp model definition
        {
          model: Bus, // Phải khớp với tên Model bạn import
          attributes: ["id", "bien_so_xe"],
        },
      ],
      order: [
        ["ngay_chay", "DESC"],
        ["gio_bat_dau", "ASC"],
      ],
    });

    // Map về dạng phẳng cho FE dễ hiển thị
    return schedules.map((s) => ({
      id: s.id,
      ngay_chay: s.ngay_chay, // YYYY-MM-DD
      gio_bat_dau: s.gio_bat_dau,

      // Thông tin Tuyến
      route_id: s.route_id,
      ten_tuyen: s.Route ? s.Route.ten_tuyen : "Tuyến đã xóa",
      mo_ta: s.Route ? s.Route.mo_ta : "",
      loai_tuyen: s.Route ? s.Route.loai_tuyen : "",

      // Thông tin Xe
      bus_id: s.bus_id,
      bien_so_xe: s.Bus ? s.Bus.bien_so_xe : "Chưa phân xe",

      // Thông tin Tài xế
      driver_id: s.driver_id, // Giữ nguyên ID gốc của User
      driver_code: s.driver ? s.driver.driver_code : null,
      ten_tai_xe: s.driver ? s.driver.ho_ten : "Chưa phân tài xế",
      sdt_tai_xe: s.driver ? s.driver.so_dien_thoai : "",

      trang_thai: s.trang_thai,
    }));
  } catch (error) {
    throw error;
  }
};

// 2. Tạo Lịch trình (Kiểm tra theo ngày VÀ loại chuyến)
const createSchedule = async (data) => {
  // data = { route_id, driver_id, bus_id, ngay_chay, gio_bat_dau }

  // Lấy thông tin tuyến để biết loại chuyến (lượt đi/lượt về)
  const route = await Route.findByPk(data.route_id);
  if (!route) throw new Error("Không tìm thấy tuyến đường!");

  // A. Check trùng tài xế (theo ngày VÀ loại chuyến)
  if (data.driver_id) {
    const driverSchedules = await Schedule.findAll({
      where: { driver_id: data.driver_id, ngay_chay: data.ngay_chay },
      include: [{ model: Route, attributes: ["loai_tuyen"] }],
    });
    const hasSameShift = driverSchedules.some(
      (s) => s.Route && s.Route.loai_tuyen === route.loai_tuyen
    );
    if (hasSameShift)
      throw new Error(
        `Tài xế này đã có lịch chạy ${
          route.loai_tuyen === "luot_di" ? "lượt đi" : "lượt về"
        } vào ngày ${data.ngay_chay}!`
      );
  }

  // B. Check trùng xe (theo ngày VÀ loại chuyến)
  if (data.bus_id) {
    const busSchedules = await Schedule.findAll({
      where: { bus_id: data.bus_id, ngay_chay: data.ngay_chay },
      include: [{ model: Route, attributes: ["loai_tuyen"] }],
    });
    const hasSameShift = busSchedules.some(
      (s) => s.Route && s.Route.loai_tuyen === route.loai_tuyen
    );
    if (hasSameShift)
      throw new Error(
        `Xe này đã được phân công chạy ${
          route.loai_tuyen === "luot_di" ? "lượt đi" : "lượt về"
        } vào ngày ${data.ngay_chay}!`
      );
  }

  // C. Tạo mới
  const newSchedule = await Schedule.create(data);

  // D. Ghi log
  try {
    const driver = data.driver_id ? await User.findByPk(data.driver_id) : null;
    const bus = data.bus_id ? await Bus.findByPk(data.bus_id) : null;

    let thaoTac = "Phân công mới";
    if (driver && bus) {
      thaoTac = `Phân công: Tài xế ${driver.ho_ten}, Xe ${bus.bien_so_xe}`;
    } else if (driver) {
      thaoTac = `Phân công: Tài xế ${driver.ho_ten} (Chưa chọn xe)`;
    } else if (bus) {
      thaoTac = `Phân công: Xe ${bus.bien_so_xe} (Chưa chọn tài xế)`;
    } else {
      thaoTac = "Tạo lịch trình (Chưa phân công)";
    }

    await AssignmentHistory.create({
      tuyen: route.ten_tuyen,
      loai_tuyen: route.loai_tuyen,
      thao_tac: thaoTac,
      thoi_gian: new Date(),
      ngay_chay_thuc_te: data.ngay_chay,
    });
    console.log(
      `✅ Đã ghi log: ${thaoTac} - Tuyến: ${route.ten_tuyen} - Ngày chạy: ${data.ngay_chay}`
    );
  } catch (err) {
    console.error("❌ Lỗi ghi log:", err);
  }

  return newSchedule;
};

// 3. Cập nhật lịch trình (Kiểm tra theo ngày VÀ loại chuyến)
const updateSchedule = async (id, data) => {
  const schedule = await Schedule.findByPk(id, {
    include: [{ model: Route, attributes: ["loai_tuyen", "ten_tuyen"] }],
  });
  if (!schedule) throw new Error("Không tìm thấy lịch trình!");

  // Lấy loại chuyến của tuyến hiện tại
  const currentRoute = schedule.Route;
  if (!currentRoute) throw new Error("Không tìm thấy thông tin tuyến!");

  // Check trùng (Trừ chính nó ra, và chỉ check cùng loại chuyến)
  if (data.driver_id && data.ngay_chay) {
    const driverSchedules = await Schedule.findAll({
      where: {
        driver_id: data.driver_id,
        ngay_chay: data.ngay_chay,
        id: { [Op.ne]: id },
      },
      include: [{ model: Route, attributes: ["loai_tuyen"] }],
    });
    const hasSameShift = driverSchedules.some(
      (s) => s.Route && s.Route.loai_tuyen === currentRoute.loai_tuyen
    );
    if (hasSameShift)
      throw new Error(
        `Tài xế bị trùng lịch ${
          currentRoute.loai_tuyen === "luot_di" ? "lượt đi" : "lượt về"
        } vào ngày này!`
      );
  }

  if (data.bus_id && data.ngay_chay) {
    const busSchedules = await Schedule.findAll({
      where: {
        bus_id: data.bus_id,
        ngay_chay: data.ngay_chay,
        id: { [Op.ne]: id },
      },
      include: [{ model: Route, attributes: ["loai_tuyen"] }],
    });
    const hasSameShift = busSchedules.some(
      (s) => s.Route && s.Route.loai_tuyen === currentRoute.loai_tuyen
    );
    if (hasSameShift)
      throw new Error(
        `Xe bị trùng lịch ${
          currentRoute.loai_tuyen === "luot_di" ? "lượt đi" : "lượt về"
        } vào ngày này!`
      );
  }

  await schedule.update(data);

  // Ghi log update
  try {
    const driver = data.driver_id ? await User.findByPk(data.driver_id) : null;
    const bus = data.bus_id ? await Bus.findByPk(data.bus_id) : null;

    let thaoTac = "Cập nhật phân công";
    if (driver && bus) {
      thaoTac = `Thay đổi: Tài xế ${driver.ho_ten}, Xe ${bus.bien_so_xe}`;
    } else if (driver) {
      thaoTac = `Thay đổi: Tài xế ${driver.ho_ten}`;
    } else if (bus) {
      thaoTac = `Thay đổi: Xe ${bus.bien_so_xe}`;
    }

    await AssignmentHistory.create({
      tuyen: currentRoute.ten_tuyen,
      loai_tuyen: currentRoute.loai_tuyen,
      thao_tac: thaoTac,
      thoi_gian: new Date(),
      ngay_chay_thuc_te: data.ngay_chay || schedule.ngay_chay,
    });
    console.log(
      `✅ Đã ghi log: ${thaoTac} - Tuyến: ${
        currentRoute.ten_tuyen
      } - Ngày chạy: ${data.ngay_chay || schedule.ngay_chay}`
    );
  } catch (e) {
    console.error("❌ Lỗi ghi log update:", e);
  }

  return schedule;
};

// 4. Xóa lịch trình
const deleteSchedule = async (id) => {
  const schedule = await Schedule.findByPk(id);
  if (!schedule) return null;

  const route = await Route.findByPk(schedule.route_id);
  const ngayChay = schedule.ngay_chay;
  await schedule.destroy();

  // Ghi log xóa
  try {
    await AssignmentHistory.create({
      tuyen: route ? route.ten_tuyen : "N/A",
      loai_tuyen: route ? route.loai_tuyen : null,
      thao_tac: "Hủy phân công (Xóa lịch trình)",
      thoi_gian: new Date(),
      ngay_chay_thuc_te: ngayChay,
    });
    console.log(
      `✅ Đã ghi log: Xóa lịch trình - Tuyến: ${
        route ? route.ten_tuyen : "N/A"
      } - Ngày chạy: ${ngayChay}`
    );
  } catch (err) {
    console.error("❌ Lỗi ghi log xóa:", err);
  }

  return true;
};

// 5. [FE gọi: getDriverWeekSchedule] Lấy lịch làm việc 1 tuần CỦA 1 TÀI XẾ
const getDriverWeekSchedule = async (driverId) => {
  // 1. Xác định tuần hiện tại
  const curr = new Date();
  const day = curr.getDay();
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Thứ 2 đầu tuần

  const monday = new Date(curr.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // 2. Query DB: Lọc theo driverId và trong tuần này
  const schedules = await Schedule.findAll({
    where: {
      driver_id: driverId, // QUAN TRỌNG: Chỉ lấy của tài xế này
      ngay_chay: { [Op.between]: [monday, sunday] },
    },
    include: [{ model: Route }, { model: Bus, attributes: ["bien_so_xe"] }],
    order: [["gio_bat_dau", "ASC"]],
  });

  // 3. Tạo khung dữ liệu trả về (Mảng 7 phần tử cho 7 ngày)
  const weekMap = {
    1: { day: "Thứ 2", slots: [] },
    2: { day: "Thứ 3", slots: [] },
    3: { day: "Thứ 4", slots: [] },
    4: { day: "Thứ 5", slots: [] },
    5: { day: "Thứ 6", slots: [] },
    6: { day: "Thứ 7", slots: [] },
    0: { day: "Chủ Nhật", slots: [] },
  };

  schedules.forEach((s) => {
    const date = new Date(s.ngay_chay);
    const dayIndex = date.getDay();
    const startTime = s.gio_bat_dau.substring(0, 5); // 06:00:00 -> 06:00

    weekMap[dayIndex].slots.push({
      id: s.id,
      type: s.Route.loai_tuyen === "luot_di" ? "go" : "back",
      route: s.Route.ten_tuyen,
      bus_plate: s.Bus ? s.Bus.bien_so_xe : "N/A",
      start: startTime,
      end: calculateEndTime(startTime, s.Route.thoi_gian_du_kien),
    });
  });

  return [
    weekMap[1],
    weekMap[2],
    weekMap[3],
    weekMap[4],
    weekMap[5],
    weekMap[6],
    weekMap[0],
  ];
};

// 6. [FE gọi: getMySchedule] Lấy lịch cho App Tài xế (Dạng Key-Value Date)
const getMySchedule = async (driverId) => {
  try {
    const schedules = await Schedule.findAll({
      where: { driver_id: driverId },
      include: [{ model: Route }, { model: Bus, attributes: ["bien_so_xe"] }],
      order: [
        ["ngay_chay", "ASC"],
        ["gio_bat_dau", "ASC"],
      ],
    });

    const result = {};

    // Dùng Promise.all để await hàm getStartEndLocation
    await Promise.all(
      schedules.map(async (s) => {
        const dateKey = s.ngay_chay; // Ví dụ: "2024-05-20"
        if (!result[dateKey]) result[dateKey] = [];

        const locations = await getStartEndLocation(s.route_id);

        result[dateKey].push({
          id: s.id,
          type: s.Route.loai_tuyen === "luot_di" ? "morning" : "afternoon",
          title: s.Route.loai_tuyen === "luot_di" ? "Lượt đi" : "Lượt về",
          time: s.gio_bat_dau.substring(0, 5),
          route: `Xe: ${s.Bus ? s.Bus.bien_so_xe : "N/A"} - ${
            s.Route.ten_tuyen
          }`,
          startLocation: locations.start,
          endLocation: locations.end,
          status: s.trang_thai,
        });
      })
    );

    return result;
  } catch (error) {
    throw error;
  }
};

// 7. [FE gọi: getAssignmentHistory] Lấy lịch sử log
const getAssignmentHistory = async (filters) => {
  // filters = { date, type }
  let whereClause = {};

  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    whereClause.ngay_chay_thuc_te = { [Op.between]: [start, end] };
  }

  if (filters.type) {
    if (filters.type !== "all") whereClause.loai_tuyen = filters.type;
  }

  const history = await AssignmentHistory.findAll({
    where: whereClause,
    order: [["thoi_gian", "DESC"]],
    limit: 50,
  });

  return history.map((h) => ({
    id: h.id,
    ngay: h.thoi_gian,
    ngay_chay_thuc_te: h.ngay_chay_thuc_te,
    noidung: h.thao_tac,
    ten_tuyen: h.tuyen,
    loai_tuyen: h.loai_tuyen,
  }));
};

module.exports = {
  createSchedule,
  getAllSchedules,
  updateSchedule,
  deleteSchedule,
  getAssignmentHistory, // Đổi tên hàm này
  getDriverWeekSchedule, // Đổi tên hàm này
  getMySchedule, // Đổi tên hàm này
};
