const {
  Schedule,
  Bus,
  Route,
  User,
  AssignmentHistory,
  RouteStop,
  Stop,
  ScheduleStudent,
  Student,
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
const getAllStops = async (routeId) => {
  try {
    const routeStops = await RouteStop.findAll({
      where: { route_id: routeId },
      include: [{ model: Stop }], // lấy toàn bộ thông tin Stop
      order: [["thu_tu", "ASC"]],
    });

    if (!routeStops || routeStops.length === 0) return [];

    // Trả về toàn bộ thông tin Stop
    return routeStops.map((rs) => ({
      id: rs.Stop.id,
      ten_diem: rs.Stop.ten_diem,
      dia_chi: rs.Stop.dia_chi,
      latitude: rs.Stop.latitude,
      longitude: rs.Stop.longitude,
    }));
  } catch (error) {
    console.error("Error in getAllStops:", error);
    return [];
  }
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

  // C.1. AUTO-ASSIGN students to this schedule
  // Find all students who use this route (via default_route_stop_id_di or default_route_stop_id_ve)
  try {
    const routeStops = await RouteStop.findAll({
      where: { route_id: data.route_id },
    });

    const routeStopIds = routeStops.map((rs) => rs.id);

    if (routeStopIds.length > 0) {
      // Find students based on route type (lượt_di or lượt_về)
      let studentsOnRoute = [];

      if (route.loai_tuyen === "luot_di") {
        // For morning routes, find students with default_route_stop_id_di
        studentsOnRoute = await Student.findAll({
          where: { default_route_stop_id_di: routeStopIds },
        });
      } else {
        // For afternoon routes, find students with default_route_stop_id_ve
        studentsOnRoute = await Student.findAll({
          where: { default_route_stop_id_ve: routeStopIds },
        });
      }

      console.log(
        `📍 Found ${studentsOnRoute.length} students for route ${data.route_id} (${route.loai_tuyen})`
      );

      // Create ScheduleStudent records for each student
      for (const student of studentsOnRoute) {
        // Find the stop_id for this student (their default stop on this route)
        let studentRouteStopId = null;
        let studentStopId = null;

        if (route.loai_tuyen === "luot_di") {
          studentRouteStopId = student.default_route_stop_id_di;
        } else {
          studentRouteStopId = student.default_route_stop_id_ve;
        }

        const studentRouteStop = routeStops.find(
          (rs) => rs.id === studentRouteStopId
        );

        if (studentRouteStop) {
          await ScheduleStudent.create({
            schedule_id: newSchedule.id,
            student_id: student.id,
            stop_id: studentRouteStop.stop_id,
            trang_thai_don: "choxacnhan",
          });
          console.log(
            `✅ Assigned student ${student.ho_ten} to schedule ${newSchedule.id}`
          );
        }
      }
    }
  } catch (assignError) {
    console.error("⚠️ Error auto-assigning students to schedule:", assignError);
    // Don't throw, just log - schedule was created successfully
  }

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

  // E. Emit WebSocket event cho tài xế (real-time notification)
  console.log(
    `[DEBUG] Checking WebSocket emit: driver_id=${
      newSchedule.driver_id
    }, global.io=${!!global.io}`
  );

  if (newSchedule.driver_id && global.io) {
    try {
      // Prepare schedule data for driver
      const scheduleWithDetails = await Schedule.findByPk(newSchedule.id, {
        include: [
          { model: Route, attributes: ["ten_tuyen", "loai_tuyen"] },
          { model: Bus, attributes: ["bien_so_xe"] },
        ],
      });

      const locations = await getStartEndLocation(newSchedule.route_id);

      const scheduleHandler = require("../sockets/schedule.handler");
      console.log(
        `[DEBUG] About to call notifyDriverNewSchedule for driver ${newSchedule.driver_id}`
      );

      scheduleHandler.notifyDriverNewSchedule(
        global.io,
        newSchedule.driver_id,
        {
          id: newSchedule.id,
          date: data.ngay_chay,
          time: data.gio_bat_dau,
          route: scheduleWithDetails.Route?.ten_tuyen,
          type: scheduleWithDetails.Route?.loai_tuyen,
          bus: scheduleWithDetails.Bus?.bien_so_xe,
          startLocation: locations.start,
          endLocation: locations.end,
          title:
            scheduleWithDetails.Route?.loai_tuyen === "luot_di"
              ? "Lượt đi"
              : "Lượt về",
        }
      );
      console.log(
        `📢 WebSocket notification sent to driver ${newSchedule.driver_id}`
      );
    } catch (err) {
      console.error("❌ Lỗi emit WebSocket:", err);
    }
  } else {
    console.log(
      `[DEBUG] WebSocket emit skipped - driver_id: ${
        newSchedule.driver_id
      }, has io: ${!!global.io}`
    );
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

  // Emit WebSocket event cho tài xế (real-time notification khi update)
  // Cần emit cho cả tài xế cũ (delete lịch) và tài xế mới (thêm lịch)
  const oldDriverId = schedule.driver_id; // Tài xế cũ
  const newDriverId = data.driver_id || schedule.driver_id; // Tài xế mới (default là tài xế cũ)

  console.log(
    `[DEBUG] updateSchedule - oldDriverId: ${oldDriverId}, newDriverId: ${newDriverId}, global.io: ${!!global.io}`
  );

  if (global.io) {
    try {
      // Prepare updated schedule data for driver
      const updatedSchedule = await Schedule.findByPk(id, {
        include: [
          { model: Route, attributes: ["ten_tuyen", "loai_tuyen"] },
          { model: Bus, attributes: ["bien_so_xe"] },
        ],
      });

      const locations = await getStartEndLocation(updatedSchedule.route_id);

      const scheduleHandler = require("../sockets/schedule.handler");

      // Normalize date: if it's already a string, use it; if it's a Date, convert to ISO
      let dateStr = updatedSchedule.ngay_chay;
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split("T")[0];
      } else if (typeof dateStr === "string" && dateStr.includes("T")) {
        dateStr = dateStr.split("T")[0];
      }

      const updateData = {
        id: updatedSchedule.id,
        date: dateStr, // Format YYYY-MM-DD
        time: updatedSchedule.gio_bat_dau,
        route: updatedSchedule.Route?.ten_tuyen,
        type: updatedSchedule.Route?.loai_tuyen,
        bus: updatedSchedule.Bus?.bien_so_xe,
        startLocation: locations.start,
        endLocation: locations.end,
        title:
          updatedSchedule.Route?.loai_tuyen === "luot_di"
            ? "Lượt đi"
            : "Lượt về",
      };

      // Nếu tài xế thay đổi, emit delete event cho tài xế cũ
      if (oldDriverId && newDriverId && oldDriverId !== newDriverId) {
        console.log(
          `[DEBUG] Driver changed from ${oldDriverId} to ${newDriverId}`
        );
        scheduleHandler.notifyDriverScheduleDeleted(global.io, oldDriverId, id);
        console.log(
          `📢 WebSocket delete notification sent to old driver ${oldDriverId}`
        );
      }

      // Emit update event cho tài xế mới (luôn emit)
      if (newDriverId) {
        console.log(
          `[DEBUG] Calling notifyDriverScheduleUpdate with:`,
          updateData
        );
        scheduleHandler.notifyDriverScheduleUpdate(
          global.io,
          newDriverId,
          updateData
        );
        console.log(
          `📢 WebSocket update notification sent to driver ${newDriverId}`
        );
      } else {
        console.log(`[DEBUG] No newDriverId to emit update`);
      }

      // Broadcast update event cho admin dashboard
      if (global.io) {
        const room = global.io.sockets.adapter.rooms.get("admin-schedule");
        const clientCount = room ? room.size : 0;
        console.log(
          `[DEBUG] Broadcasting to admin-schedule - clients: ${clientCount}`
        );
        global.io.to("admin-schedule").emit("schedule-updated", {
          id,
          route_id: data.route_id,
          driver_id: newDriverId,
          bus_id: data.bus_id,
          createDate: normalizeDate(data.createDate),
          shift: data.shift,
          start: normalizeTime(data.start || schedule.gio_bat_dau),
        });
        console.log(`📢 Admin broadcast sent for schedule update ${id}`);
      } else {
        console.log("❌ global.io not available for admin broadcast");
      }
    } catch (err) {
      console.error("❌ Lỗi emit WebSocket update:", err);
    }
  } else {
    console.log(`[DEBUG] Skipping WebSocket update - has io: ${!!global.io}`);
  }

  return schedule;
};

// 4. Xóa lịch trình
const deleteSchedule = async (id) => {
  const schedule = await Schedule.findByPk(id);
  if (!schedule) return null;

  const route = await Route.findByPk(schedule.route_id);
  const ngayChay = schedule.ngay_chay;
  const driverId = schedule.driver_id;

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

  // Emit WebSocket event cho tài xế (real-time notification khi delete)
  console.log(
    `[DEBUG] deleteSchedule - driverId: ${driverId}, scheduleId: ${id}, global.io: ${!!global.io}`
  );

  if (driverId && global.io) {
    try {
      const scheduleHandler = require("../sockets/schedule.handler");
      console.log(
        `[DEBUG] Calling notifyDriverScheduleDeleted with driverId: ${driverId}, scheduleId: ${id}`
      );
      scheduleHandler.notifyDriverScheduleDeleted(global.io, driverId, id);
      console.log(
        `📢 WebSocket delete notification sent to driver ${driverId}`
      );

      // Broadcast delete event cho admin dashboard
      if (global.io) {
        const room = global.io.sockets.adapter.rooms.get("admin-schedule");
        const clientCount = room ? room.size : 0;
        console.log(
          `[DEBUG] Broadcasting to admin-schedule - clients: ${clientCount}`
        );
        global.io.to("admin-schedule").emit("schedule-deleted", {
          scheduleId: id,
        });
        console.log(`📢 Admin broadcast sent for schedule deletion ${id}`);
      } else {
        console.log("❌ global.io not available for admin broadcast");
      }
    } catch (err) {
      console.error("❌ Lỗi emit WebSocket delete:", err);
    }
  } else {
    console.log(
      `[DEBUG] Skipping WebSocket delete - driverId: ${driverId}, has io: ${!!global.io}`
    );
  }

  return true;
};

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
          stops: await getAllStops(s.route_id),
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
// 8. Lấy danh sách học sinh theo lịch trình (Cho Tài xế xem danh sách đón)
const getStudentsByScheduleId = async (scheduleId) => {
  try {
    // 1. Lấy thông tin chuyến đi để biết nó thuộc Route nào
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) throw new Error("Chuyến đi không tồn tại");

    // 2. Lấy thứ tự các trạm của Route đó (Để sắp xếp danh sách đón)
    const routeStops = await RouteStop.findAll({
      where: { route_id: schedule.route_id },
      order: [["thu_tu", "ASC"]],
    });

    // Tạo map để tra cứu thứ tự: { stop_id: thu_tu }
    // Ví dụ: { 10: 1, 15: 2 } (Trạm ID 10 là trạm số 1...)
    const stopOrderMap = {};
    routeStops.forEach((rs) => {
      stopOrderMap[rs.stop_id] = rs.thu_tu;
    });

    // 3. Lấy danh sách học sinh trong chuyến này
    const scheduleStudents = await ScheduleStudent.findAll({
      where: { schedule_id: scheduleId },
      include: [
        {
          model: Student,
          attributes: ["id", "ho_ten", "lop", "gioi_tinh", "ngay_sinh"],
          include: [
            {
              model: User,
              as: "parent",
              attributes: ["ho_ten", "so_dien_thoai"], // Lấy SĐT để tài xế gọi khi cần
            },
          ],
        },
        {
          model: Stop,
          attributes: ["id", "ten_diem", "dia_chi", "latitude", "longitude"],
        },
        {
          model: Schedule,
          include: [
            { model: Route, attributes: ["id", "ten_tuyen", "loai_tuyen"] },
          ],
        },
      ],
    });

    // 4. Format dữ liệu và Sắp xếp theo thứ tự trạm
    const result = scheduleStudents.map((item) => ({
      // Thông tin điểm danh (để gọi API update status)
      schedule_id: item.schedule_id,
      student_id: item.student_id,
      trang_thai: item.trang_thai_don, // 'choxacnhan', 'dihoc'...

      // Thông tin hiển thị
      ho_ten_hs: item.Student.ho_ten,
      lop: item.Student.lop,
      gioi_tinh: item.Student.gioi_tinh,

      // Thông tin phụ huynh (để gọi điện)
      phu_huynh: item.Student.parent ? item.Student.parent.ho_ten : "",
      sdt_ph: item.Student.parent ? item.Student.parent.so_dien_thoai : "",

      // Thông tin điểm đón
      ten_tram: item.Stop.ten_diem,
      dia_chi_tram: item.Stop.dia_chi,
      toa_do: [parseFloat(item.Stop.latitude), parseFloat(item.Stop.longitude)],
      diem_don: item.ten_diem,

      // Thứ tự đón (Dùng để sort)
      thu_tu_don: stopOrderMap[item.stop_id] || 999,
    }));

    // Sắp xếp: Ai đón trạm đầu thì hiện lên trước
    result.sort((a, b) => a.thu_tu_don - b.thu_tu_don);

    return result;
  } catch (error) {
    throw error;
  }
};
const getStudentsForDriverCurrentTrip = async (driverId, loaiTuyen = null) => {
  try {
    const today = new Date(); // Lấy ngày giờ hiện tại
    const timeNow = today.toTimeString().split(" ")[0]; // "08:30:00"

    // 1. Tìm tất cả lịch hôm nay của tài xế
    const schedules = await Schedule.findAll({
      where: {
        driver_id: driverId,
        ngay_chay: today,
      },
      include: [
        { model: Route }, // thêm include Route để lấy loai_tuyen
      ],
      order: [["gio_bat_dau", "ASC"]],
    });

    if (!schedules || schedules.length === 0) {
      return { message: "Hôm nay tài xế không có lịch chạy nào.", data: [] };
    }

    // 1.5. Filter by loai_tuyen nếu được truyền
    let filteredSchedules = schedules;
    if (loaiTuyen) {
      filteredSchedules = schedules.filter(
        (s) => s.Route && s.Route.loai_tuyen === loaiTuyen
      );
      if (filteredSchedules.length === 0) {
        return { message: "Không có lịch chạy loại " + loaiTuyen, data: [] };
      }
    }

    // 2. Thuật toán tìm "Chuyến gần nhất"
    let selectedSchedule = null;

    // Ưu tiên 1: Tìm chuyến đang chạy
    const activeSchedule = filteredSchedules.find(
      (s) => s.trang_thai === "dangchay"
    );

    if (activeSchedule) {
      selectedSchedule = activeSchedule;
    } else {
      // Ưu tiên 2: Tìm chuyến sắp chạy (Chưa bắt đầu và Giờ chạy > Giờ hiện tại)
      // Hoặc nếu đã qua hết giờ thì lấy chuyến cuối cùng
      const upcomingSchedule = filteredSchedules.find(
        (s) => s.trang_thai === "chuabatdau" && s.gio_bat_dau >= timeNow
      );

      // Nếu có chuyến sắp tới thì lấy, không thì lấy chuyến cuối cùng trong ngày (để xem lại)
      selectedSchedule =
        upcomingSchedule || filteredSchedules[filteredSchedules.length - 1];
    }

    if (!selectedSchedule) {
      return { message: "Không tìm thấy chuyến phù hợp.", data: [] };
    }

    // 3. Tái sử dụng hàm lấy học sinh cũ để lấy danh sách
    const students = await getStudentsByScheduleId(selectedSchedule.id);

    return {
      current_schedule: {
        id: selectedSchedule.id,
        gio_bat_dau: selectedSchedule.gio_bat_dau,
        trang_thai: selectedSchedule.trang_thai,
        loai_tuyen: selectedSchedule.Route
          ? selectedSchedule.Route.loai_tuyen
          : null,
      },
      students: students,
    };
  } catch (error) {
    throw error;
  }
};
// --- HÀM MỚI: Lấy thông tin đưa đón cho Phụ huynh ---
const getParentDashboardInfo = async (parentId) => {
  try {
    console.log("parentId =", parentId);

    const today = new Date().toISOString().slice(0, 10);
    console.log("Today's date:", today);
    // Nếu muốn test ngày khác thì hardcode ngày vào đây, ví dụ: '2025-12-25'

    // 1. Tìm tất cả con của phụ huynh này
    const students = await Student.findAll({
      where: { parent_id: parentId },
      include: [
        {
          // 2. Tìm lịch trình mà con được gán
          model: ScheduleStudent,
          required: false, // Vẫn lấy thông tin con dù không có lịch
          include: [
            {
              // 3. Join Schedule - eager load ALL schedule records (không filter ở đây)
              model: Schedule,
              required: false, // Cho phép lấy ScheduleStudent dù không có schedule
              include: [
                {
                  model: Route,
                  attributes: [
                    "id",
                    "ten_tuyen",
                    "mo_ta",
                    "khoang_cach",
                    "loai_tuyen",
                  ],
                },
                {
                  model: Bus,
                  attributes: ["id", "bien_so_xe", "hang_xe"],
                },
                {
                  model: User,
                  as: "driver",
                  attributes: ["id", "ho_ten", "so_dien_thoai"],
                },
              ],
            },
            {
              model: Stop, // Lấy điểm đón/trả
              attributes: ["id", "ten_diem", "dia_chi"],
            },
          ],
        },
      ],
    });
    console.log(`👉 Tìm thấy ${students.length} học sinh.`);
    students.forEach((s) => {
      console.log(`- Bé ${s.ho_ten}: ${s.ScheduleStudents.length} chuyến.`);
      s.ScheduleStudents.forEach((ss, idx) => {
        console.log(
          `  + Chuyến ${idx + 1}: ScheduleStudent.schedule_id=${
            ss.schedule_id
          }, Schedule=${ss.Schedule ? ss.Schedule.id : "null"}, ngay_chay=${
            ss.Schedule ? ss.Schedule.ngay_chay : "N/A"
          }`
        );
        if (!ss.Schedule && ss.schedule_id) {
          console.warn(
            `⚠️ ALERT: ScheduleStudent ${ss.id} has schedule_id=${ss.schedule_id} but Schedule is NULL!`
          );
        }
      });
    });
    // 3. Format dữ liệu gọn gàng cho App Phụ huynh
    return students.map((child) => {
      // Lấy danh sách các chuyến đi trong ngày (có thể có Sáng & Chiều)
      const trips = child.ScheduleStudents.filter((ss, idx) => {
        // DEBUG: Log raw ScheduleStudent object
        console.log(`\n🔍 [DEBUG] ScheduleStudent #${idx}:`, {
          id: ss.id,
          schedule_id: ss.schedule_id,
          hasScheduleProp: "Schedule" in ss,
          scheduleIsNull: ss.Schedule === null,
          scheduleIsUndefined: ss.Schedule === undefined,
          scheduleKeys: ss.Schedule ? Object.keys(ss.Schedule) : "N/A",
        });

        // Filter by today's date first
        if (!ss.Schedule) {
          console.warn(
            `⚠️ ScheduleStudent ${ss.id} has no Schedule (null/undefined)`
          );
          console.log(
            `  ScheduleStudent raw data:`,
            ss.toJSON ? ss.toJSON() : ss
          );
          return false;
        }
        if (ss.Schedule.ngay_chay !== today) {
          console.log(
            `ℹ️ Skipping ScheduleStudent ${ss.id}: not today (${ss.Schedule.ngay_chay} !== ${today})`
          );
          return false;
        }
        if (!ss.Schedule.Route) {
          console.warn(`⚠️ Schedule ${ss.Schedule.id} has no Route`);
          return false;
        }
        if (!ss.Schedule.Bus) {
          console.warn(`⚠️ Schedule ${ss.Schedule.id} has no Bus`);
          return false;
        }
        return true;
      }).map((ss) => {
        const s = ss.Schedule;
        // These are now guaranteed to exist after filter
        return {
          schedule_id: s.id,
          route_id: s.route_id, // ✅ Thêm route_id để lấy thông tin tuyến hoàn chỉnh
          loai_chuyen:
            s.Route.loai_tuyen === "luot_di"
              ? "Lượt đi (Đón)"
              : "Lượt về (Trả)",
          gio_du_kien: s.gio_bat_dau,
          trang_thai_chuyen: s.trang_thai, // chuabatdau, dangchay...

          // Thông tin Tuyến
          ten_tuyen: s.Route.ten_tuyen,
          khoang_cach: s.Route.khoang_cach,
          // Thông tin Xe
          bien_so_xe: s.Bus.bien_so_xe,
          hang_xe: s.Bus.hang_xe,

          // Thông tin Tài xế (Quan trọng để PH liên lạc)
          tai_xe:
            s.driver && s.driver.ho_ten ? s.driver.ho_ten : "Chưa phân công",
          sdt_tai_xe:
            s.driver && s.driver.so_dien_thoai ? s.driver.so_dien_thoai : "",

          // Trạng thái con mình (Đã lên xe chưa)
          trang_thai_con: ss.trang_thai_don, // choxacnhan, dihoc, daxuong

          // Điểm đón/trả cụ thể của con
          diem_dung: ss.Stop ? ss.Stop.ten_diem : "",
        };
      });

      return {
        student_id: child.id,
        ten_con: child.ho_ten,
        lop: child.lop,
        danh_sach_chuyen: trips, // Mảng các chuyến xe hôm nay của bé
      };
    });
  } catch (error) {
    throw error;
  }
};

// --- HÀM UPDATE STUDENT STATUS ---
const updateStudentStatus = async (scheduleId, studentId, newStatus) => {
  try {
    const scheduleStudent = await ScheduleStudent.findOne({
      where: {
        schedule_id: scheduleId,
        student_id: studentId,
      },
    });

    if (!scheduleStudent) {
      throw new Error("Không tìm thấy học sinh trong chuyến này");
    }

    // Validate status
    const validStatuses = ["choxacnhan", "dihoc", "vangmat", "daxuong"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(
        `Trạng thái không hợp lệ. Phải là một trong: ${validStatuses.join(
          ", "
        )}`
      );
    }

    await scheduleStudent.update({
      trang_thai_don: newStatus,
      thoi_gian_don_thuc_te: newStatus !== "choxacnhan" ? new Date() : null,
    });

    console.log(
      `✅ Updated student ${studentId} status to ${newStatus} in schedule ${scheduleId}`
    );

    return {
      schedule_id: scheduleId,
      student_id: studentId,
      trang_thai: newStatus,
    };
  } catch (error) {
    console.error("Error updating student status:", error);
    throw error;
  }
};

module.exports = {
  createSchedule,
  getAllSchedules,
  updateSchedule,
  deleteSchedule,
  getAssignmentHistory,
  getDriverWeekSchedule,
  getMySchedule,
  getStudentsByScheduleId,
  getStudentsForDriverCurrentTrip,
  getParentDashboardInfo,
  updateStudentStatus,
  getStudentsByStop,
  calculateStopDistances,
};

// Haversine formula để tính khoảng cách giữa 2 điểm (meter)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Bán kính Trái Đất (meter)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in meters
}

// Lấy danh sách học sinh theo trạm của 1 chuyến đi
async function getStudentsByStop(scheduleId) {
  try {
    // 1. Lấy thông tin schedule + route + stops
    const schedule = await Schedule.findOne({
      where: { id: scheduleId },
      include: [{ model: Route }],
    });

    if (!schedule) throw new Error("Schedule not found");

    // 2. Lấy tất cả stops của route này
    const routeStops = await RouteStop.findAll({
      where: { route_id: schedule.route_id },
      include: [{ model: Stop }],
      order: [["thu_tu", "ASC"]],
    });

    if (!routeStops || routeStops.length === 0) {
      return [];
    }

    // 3. Lấy tất cả schedule_students của schedule này
    const scheduleStudents = await ScheduleStudent.findAll({
      where: { schedule_id: scheduleId },
      include: [{ model: Student }, { model: Schedule }],
    });

    // 4. Map: Mỗi stop có danh sách học sinh
    const studentsByStop = routeStops.map((routeStop, index) => {
      // Tìm các học sinh có điểm dừng này
      const studentsAtThisStop = scheduleStudents.filter(
        (ss) => ss.stop_id === routeStop.stop_id
      );

      return {
        stopId: routeStop.stop_id,
        stopName: routeStop.Stop.ten_diem,
        stopAddress: routeStop.Stop.dia_chi,
        latitude: parseFloat(routeStop.Stop.latitude),
        longitude: parseFloat(routeStop.Stop.longitude),
        stopOrder: index + 1,
        students: studentsAtThisStop.map((ss) => ({
          scheduleStudentId: ss.id,
          studentId: ss.student_id,
          studentName: ss.Student ? ss.Student.ho_ten : "Unknown",
          studentClass: ss.Student ? ss.Student.lop : "",
          status: ss.trang_thai_don, // 'choxacnhan', 'dihoc', 'vangmat', 'daxuong'
          checkInTime: ss.thoi_gian_don_thuc_te,
        })),
      };
    });

    return studentsByStop;
  } catch (error) {
    console.error("Error in getStudentsByStop:", error);
    throw error;
  }
}

// Tính khoảng cách từ vị trí tài xế đến các trạm
async function calculateStopDistances(scheduleId, driverLat, driverLng) {
  try {
    // 1. Lấy schedule + route
    const schedule = await Schedule.findOne({
      where: { id: scheduleId },
      include: [{ model: Route }],
    });

    if (!schedule) throw new Error("Schedule not found");

    // 2. Lấy tất cả stops
    const routeStops = await RouteStop.findAll({
      where: { route_id: schedule.route_id },
      include: [{ model: Stop }],
      order: [["thu_tu", "ASC"]],
    });

    if (!routeStops || routeStops.length === 0) {
      return [];
    }

    // 3. Tính khoảng cách từ driver đến mỗi stop
    const stopDistances = routeStops.map((routeStop, index) => {
      const stopLat = parseFloat(routeStop.Stop.latitude);
      const stopLng = parseFloat(routeStop.Stop.longitude);

      const distance = calculateDistance(
        driverLat,
        driverLng,
        stopLat,
        stopLng
      );

      // Xác định nếu tài xế đã "tới" trạm (< 100m)
      const isNearby = distance < 100;

      return {
        stopId: routeStop.stop_id,
        stopName: routeStop.Stop.ten_diem,
        stopAddress: routeStop.Stop.dia_chi,
        latitude: stopLat,
        longitude: stopLng,
        stopOrder: index + 1,
        distance: Math.round(distance), // meter
        isNearby: isNearby,
        distanceText:
          distance < 1000
            ? `${Math.round(distance)}m`
            : `${(distance / 1000).toFixed(1)}km`,
      };
    });

    return stopDistances;
  } catch (error) {
    console.error("Error in calculateStopDistances:", error);
    throw error;
  }
}
