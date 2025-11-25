const { Schedule, Bus, Route, User, AssignmentHistory, RouteStop, Stop } = require('../data/models');
const { Op } = require('sequelize');

// --- HÀM PHỤ TRỢ (HELPER) ---

// 1. Tính giờ kết thúc (Giờ bắt đầu + Thời gian chạy)
const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime) return "00:00";
    const [hour, minute] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0);
    date.setMinutes(date.getMinutes() + (durationMinutes || 0));
    
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 2. Lấy điểm đầu và điểm cuối của một tuyến
const getStartEndLocation = async (routeId) => {
    const routeStops = await RouteStop.findAll({
        where: { route_id: routeId },
        include: [{ model: Stop, attributes: ['ten_diem'] }],
        order: [['thu_tu', 'ASC']]
    });
    
    if (!routeStops || routeStops.length < 2) return { start: 'N/A', end: 'N/A' };
    
    return {
        start: routeStops[0].Stop.ten_diem,
        end: routeStops[routeStops.length - 1].Stop.ten_diem
    };
};

// --- MAIN FUNCTIONS (API LOGIC) ---

// 1. Tạo Lịch trình (Có check trùng & Ghi log)
const createSchedule = async (data) => {
    // data = { route_id, driver_id, bus_id, ngay_chay, gio_bat_dau }

    // A. LOGIC CHECK TRÙNG
    const driverBusy = await Schedule.findOne({
        where: { driver_id: data.driver_id, ngay_chay: data.ngay_chay }
    });
    if (driverBusy) throw new Error(`Tài xế này đã có lịch chạy vào ngày ${data.ngay_chay} rồi!`);

    const busBusy = await Schedule.findOne({
        where: { bus_id: data.bus_id, ngay_chay: data.ngay_chay }
    });
    if (busBusy) throw new Error(`Xe này đã được phân công chạy vào ngày ${data.ngay_chay} rồi!`);

    // B. TẠO LỊCH TRÌNH
    const newSchedule = await Schedule.create(data);

    // C. GHI LỊCH SỬ
    try {
        const route = await Route.findByPk(data.route_id);
        const driver = await User.findByPk(data.driver_id);
        
        await AssignmentHistory.create({
            tuyen: route ? route.ten_tuyen : `Tuyến ID ${data.route_id}`,
            loai_tuyen: route ? route.loai_tuyen : null,
            thao_tac: `Thêm phân công cho tài xế ${driver ? driver.ho_ten : ''}`,
        });
    } catch (err) { console.error("Lỗi ghi lịch sử:", err); }

    return newSchedule;
};

// 2. Lấy danh sách lịch trình (Cho bảng Dashboard)
const getAllSchedules = async () => {
    return await Schedule.findAll({
        include: [
            { model: Route, attributes: ['ten_tuyen', 'mo_ta', 'loai_tuyen'] },
            { model: Bus, attributes: ['bien_so_xe'] },
            { model: User, as: 'driver', attributes: ['ho_ten', 'so_dien_thoai'] }
        ],
        order: [['ngay_chay', 'DESC'], ['gio_bat_dau', 'ASC']]
    });
};
// 3. Cập nhật lịch trình (Có check trùng & Ghi log)
const updateSchedule = async (id, data) => {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) throw new Error("Không tìm thấy lịch trình!");

    // A. Check trùng (QUAN TRỌNG: Phải loại trừ chính ID hiện tại ra)
    // Nếu thay đổi tài xế hoặc ngày, mới check tài xế
    if (data.driver_id && data.ngay_chay) {
        const driverBusy = await Schedule.findOne({
            where: { 
                driver_id: data.driver_id, 
                ngay_chay: data.ngay_chay,
                id: { [Op.ne]: id } // Khác ID hiện tại
            }
        });
        if (driverBusy) throw new Error(`Tài xế đã có lịch khác vào ngày ${data.ngay_chay}!`);
    }

    // Nếu thay đổi xe hoặc ngày, mới check xe
    if (data.bus_id && data.ngay_chay) {
        const busBusy = await Schedule.findOne({
            where: { 
                bus_id: data.bus_id, 
                ngay_chay: data.ngay_chay,
                id: { [Op.ne]: id } 
            }
        });
        if (busBusy) throw new Error(`Xe đã có lịch khác vào ngày ${data.ngay_chay}!`);
    }

    // B. Update
    await schedule.update(data);

    // C. Ghi log
    try {
        const route = await Route.findByPk(schedule.route_id);
        await AssignmentHistory.create({
            tuyen: route ? route.ten_tuyen : `Tuyến ${schedule.route_id}`,
            loai_tuyen: route ? route.loai_tuyen : null,
            thao_tac: 'Cập nhật phân công',
        });
    } catch (e) { console.error(e); }

    return schedule;
};
// 3. Xóa lịch trình (Có ghi log)
const deleteSchedule = async (id) => {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) return null;

    const route = await Route.findByPk(schedule.route_id);

    await schedule.destroy();

    try {
        await AssignmentHistory.create({
            tuyen: route ? route.ten_tuyen : 'Tuyến không xác định',
            loai_tuyen: route ? route.loai_tuyen : null,
            thao_tac: 'Hủy phân công (Xóa lịch)',
        });
    } catch (err) { console.error(err); }

    return true;
};

// 4. Lấy lịch sử thao tác (Lọc theo Ngày & Loại)
const getHistory = async (dateStr, typeStr) => {
    let whereClause = {};
    
    if (dateStr) {
        const start = new Date(dateStr); start.setHours(0,0,0,0);
        const end = new Date(dateStr); end.setHours(23,59,59,999);
        whereClause.thoi_gian = { [Op.between]: [start, end] };
    }

    if (typeStr) {
        whereClause.loai_tuyen = typeStr;
    }

    return await AssignmentHistory.findAll({
        where: whereClause,
        order: [['thoi_gian', 'DESC']],
        limit: 50
    });
};

// 5. API CHO ADMIN (Xem toàn bộ lịch của TẤT CẢ tài xế trong tuần)
const getAdminWeekSchedule = async () => {
    // 1. Xác định tuần hiện tại (T2 -> CN)
    const curr = new Date();
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    
    const monday = new Date(curr.setDate(diff));
    monday.setHours(0,0,0,0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    // 2. Query DB (Lấy TẤT CẢ - Không lọc driver_id)
    const schedules = await Schedule.findAll({
        where: {
            // Chỉ lọc theo ngày, bỏ driver_id đi
            ngay_chay: { [Op.between]: [monday, sunday] }
        },
        include: [
            { model: Route },
            { model: User, as: 'driver', attributes: ['ho_ten'] }, // Lấy tên tài xế
            { model: Bus, attributes: ['bien_so_xe'] } // Lấy biển số xe
        ],
        order: [['gio_bat_dau', 'ASC']] // Sắp xếp theo giờ để dễ nhìn
    });

    // 3. Tạo khung
    const weekMap = {
        1: { day: "Thứ 2", slots: [] },
        2: { day: "Thứ 3", slots: [] },
        3: { day: "Thứ 4", slots: [] },
        4: { day: "Thứ 5", slots: [] },
        5: { day: "Thứ 6", slots: [] },
        6: { day: "Thứ 7", slots: [] },
        0: { day: "Chủ Nhật", slots: [] },
    };

    // 4. Đổ dữ liệu
    schedules.forEach(s => {
        const date = new Date(s.ngay_chay);
        const dayIndex = date.getDay();
        const startTime = s.gio_bat_dau.substring(0, 5);

        weekMap[dayIndex].slots.push({
            id: s.id,
            // --- Thêm thông tin này để Admin biết ai chạy ---
            driver_name: s.driver ? s.driver.ho_ten : "Chưa phân công",
            bus_plate: s.Bus ? s.Bus.bien_so_xe : "N/A",
            // -----------------------------------------------
            
            type: s.Route.loai_tuyen === 'luot_di' ? 'go' : 'back',
            route: s.Route.ten_tuyen,
            start: startTime,
            end: calculateEndTime(startTime, s.Route.thoi_gian_du_kien)
        });
    });

    return [weekMap[1], weekMap[2], weekMap[3], weekMap[4], weekMap[5], weekMap[6], weekMap[0]];
};

// 6. API CHO APP TÀI XẾ (Xem theo Ngày: Key-Value)
const getScheduleForDriverApp = async (driverId) => {
    try {
        const schedules = await Schedule.findAll({
            where: { driver_id: driverId },
            include: [ { model: Route }, { model: Bus } ],
            order: [['ngay_chay', 'ASC'], ['gio_bat_dau', 'ASC']]
        });

        const result = {};

        await Promise.all(schedules.map(async (s) => {
            const dateKey = s.ngay_chay; 
            if (!result[dateKey]) result[dateKey] = [];

            const locations = await getStartEndLocation(s.route_id);

            result[dateKey].push({
                id: s.id,
                type: s.Route.loai_tuyen === 'luot_di' ? 'morning' : 'afternoon',
                title: s.Route.loai_tuyen === 'luot_di' ? 'Lượt đi' : 'Lượt về',
                time: s.gio_bat_dau.substring(0, 5),
                route: `Xe: ${s.Bus.bien_so_xe} - ${s.Route.ten_tuyen}`,
                startLocation: locations.start,
                endLocation: locations.end
            });
        }));

        return result;
    } catch (error) {
        throw error;
    }
};

module.exports = { 
    createSchedule, 
    getAllSchedules, 
    updateSchedule,
    deleteSchedule, 
    getHistory,
    getAdminWeekSchedule,
    getScheduleForDriverApp
};