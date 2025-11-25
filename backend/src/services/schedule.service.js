const { Schedule, Bus, Route, User, AssignmentHistory, RouteStop, Stop } = require('../data/models');
const { Op } = require('sequelize');

// --- HÀM PHỤ TRỢ (HELPER) ---

// 1. Tính giờ kết thúc
const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime) return "00:00";
    const [hour, minute] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0);
    date.setMinutes(date.getMinutes() + (durationMinutes || 0));
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 2. Lấy điểm đầu và điểm cuối
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

// 1. Lấy danh sách lịch trình (Cho Admin Dashboard - Table View)
const getAllSchedules = async () => {
    try {
        const schedules = await Schedule.findAll({
            include: [
                { model: Route, attributes: ['id', 'ten_tuyen', 'loai_tuyen'] },
                { model: User, as: 'driver', attributes: ['id', 'ho_ten', 'so_dien_thoai'] } // Lưu ý: as 'Driver' phải khớp model definition
            ],
            order: [['ngay_chay', 'DESC'], ['gio_bat_dau', 'ASC']]
        });

        // Map về dạng phẳng cho FE dễ hiển thị
        return schedules.map(s => ({
            id: s.id,
            ngay_chay: s.ngay_chay, // YYYY-MM-DD
            gio_bat_dau: s.gio_bat_dau,
            
            // Thông tin Tuyến
            route_id: s.route_id,
            ten_tuyen: s.Route ? s.Route.ten_tuyen : 'Tuyến đã xóa',
            loai_tuyen: s.Route ? s.Route.loai_tuyen : '',
            
            // Thông tin Xe
            bus_id: s.bus_id,
            bien_so_xe: s.Bus ? s.Bus.bien_so_xe : 'Chưa phân xe',
            
            // Thông tin Tài xế
            driver_id: s.driver_id,
            ten_tai_xe: s.Driver ? s.Driver.ho_ten : 'Chưa phân tài xế',
            sdt_tai_xe: s.Driver ? s.Driver.so_dien_thoai : '',
            
            trang_thai: s.trang_thai
        }));
    } catch (error) {
        throw error;
    }
};

// 2. Tạo Lịch trình (Giữ nguyên logic check trùng của bạn)
const createSchedule = async (data) => {
    // data = { route_id, driver_id, bus_id, ngay_chay, gio_bat_dau }

    // A. Check trùng tài xế
    const driverBusy = await Schedule.findOne({
        where: { driver_id: data.driver_id, ngay_chay: data.ngay_chay }
    });
    if (driverBusy) throw new Error(`Tài xế này đã có lịch chạy vào ngày ${data.ngay_chay}!`);

    // B. Check trùng xe
    const busBusy = await Schedule.findOne({
        where: { bus_id: data.bus_id, ngay_chay: data.ngay_chay }
    });
    if (busBusy) throw new Error(`Xe này đã được phân công chạy vào ngày ${data.ngay_chay}!`);

    // C. Tạo mới
    const newSchedule = await Schedule.create(data);

    // D. Ghi log
    try {
        const route = await Route.findByPk(data.route_id);
        const driver = await User.findByPk(data.driver_id);
        await AssignmentHistory.create({
            tuyen: route ? route.ten_tuyen : `Tuyến ID ${data.route_id}`,
            loai_tuyen: route ? route.loai_tuyen : null,
            thao_tac: `Phân công mới cho: ${driver ? driver.ho_ten : 'Tài xế'}`,
            thoi_gian: new Date()
        });
    } catch (err) { console.error("Lỗi ghi log:", err); }

    return newSchedule;
};

// 3. Cập nhật lịch trình (Giữ nguyên logic của bạn)
const updateSchedule = async (id, data) => {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) throw new Error("Không tìm thấy lịch trình!");

    // Check trùng (Trừ chính nó ra)
    if (data.driver_id && data.ngay_chay) {
        const driverBusy = await Schedule.findOne({
            where: { 
                driver_id: data.driver_id, 
                ngay_chay: data.ngay_chay,
                id: { [Op.ne]: id }
            }
        });
        if (driverBusy) throw new Error(`Tài xế bị trùng lịch vào ngày này!`);
    }

    if (data.bus_id && data.ngay_chay) {
        const busBusy = await Schedule.findOne({
            where: { 
                bus_id: data.bus_id, 
                ngay_chay: data.ngay_chay,
                id: { [Op.ne]: id } 
            }
        });
        if (busBusy) throw new Error(`Xe bị trùng lịch vào ngày này!`);
    }

    await schedule.update(data);

    // Ghi log update
    try {
        const route = await Route.findByPk(schedule.route_id);
        await AssignmentHistory.create({
            tuyen: route ? route.ten_tuyen : `ID ${schedule.route_id}`,
            loai_tuyen: route ? route.loai_tuyen : null,
            thao_tac: 'Cập nhật phân công',
            thoi_gian: new Date()
        });
    } catch (e) { console.error(e); }

    return schedule;
};

// 4. Xóa lịch trình
const deleteSchedule = async (id) => {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) return null;

    const route = await Route.findByPk(schedule.route_id);
    await schedule.destroy();

    // Ghi log xóa
    try {
        await AssignmentHistory.create({
            tuyen: route ? route.ten_tuyen : 'N/A',
            loai_tuyen: route ? route.loai_tuyen : null,
            thao_tac: 'Hủy phân công (Xóa)',
            thoi_gian: new Date()
        });
    } catch (err) { console.error(err); }

    return true;
};

// 5. [FE gọi: getDriverWeekSchedule] Lấy lịch làm việc 1 tuần CỦA 1 TÀI XẾ
const getDriverWeekSchedule = async (driverId) => {
    // 1. Xác định tuần hiện tại
    const curr = new Date();
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Thứ 2 đầu tuần
    
    const monday = new Date(curr.setDate(diff));
    monday.setHours(0,0,0,0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    // 2. Query DB: Lọc theo driverId và trong tuần này
    const schedules = await Schedule.findAll({
        where: {
            driver_id: driverId, // QUAN TRỌNG: Chỉ lấy của tài xế này
            ngay_chay: { [Op.between]: [monday, sunday] }
        },
        include: [
            { model: Route },
            { model: Bus, attributes: ['bien_so_xe'] }
        ],
        order: [['gio_bat_dau', 'ASC']]
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

    schedules.forEach(s => {
        const date = new Date(s.ngay_chay);
        const dayIndex = date.getDay();
        const startTime = s.gio_bat_dau.substring(0, 5); // 06:00:00 -> 06:00

        weekMap[dayIndex].slots.push({
            id: s.id,
            type: s.Route.loai_tuyen === 'luot_di' ? 'go' : 'back',
            route: s.Route.ten_tuyen,
            bus_plate: s.Bus ? s.Bus.bien_so_xe : "N/A",
            start: startTime,
            end: calculateEndTime(startTime, s.Route.thoi_gian_du_kien)
        });
    });

    return [weekMap[1], weekMap[2], weekMap[3], weekMap[4], weekMap[5], weekMap[6], weekMap[0]];
};

// 6. [FE gọi: getMySchedule] Lấy lịch cho App Tài xế (Dạng Key-Value Date)
const getMySchedule = async (driverId) => {
    try {
        const schedules = await Schedule.findAll({
            where: { driver_id: driverId },
            include: [ 
                { model: Route }, 
                { model: Bus, attributes: ['bien_so_xe'] } 
            ],
            order: [['ngay_chay', 'ASC'], ['gio_bat_dau', 'ASC']]
        });

        const result = {};

        // Dùng Promise.all để await hàm getStartEndLocation
        await Promise.all(schedules.map(async (s) => {
            const dateKey = s.ngay_chay; // Ví dụ: "2024-05-20"
            if (!result[dateKey]) result[dateKey] = [];

            const locations = await getStartEndLocation(s.route_id);

            result[dateKey].push({
                id: s.id,
                type: s.Route.loai_tuyen === 'luot_di' ? 'morning' : 'afternoon',
                title: s.Route.loai_tuyen === 'luot_di' ? 'Lượt đi' : 'Lượt về',
                time: s.gio_bat_dau.substring(0, 5),
                route: `Xe: ${s.Bus ? s.Bus.bien_so_xe : 'N/A'} - ${s.Route.ten_tuyen}`,
                startLocation: locations.start,
                endLocation: locations.end,
                status: s.trang_thai
            });
        }));

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
        const start = new Date(filters.date); start.setHours(0,0,0,0);
        const end = new Date(filters.date); end.setHours(23,59,59,999);
        whereClause.thoi_gian = { [Op.between]: [start, end] };
    }

    if (filters.type) {
        
        if(filters.type !== 'all') whereClause.loai_tuyen = filters.type;
    }

    const history = await AssignmentHistory.findAll({
        where: whereClause,
        order: [['thoi_gian', 'DESC']],
        limit: 50
    });

  
    return history.map(h => ({
        id: h.id,
        ngay: h.thoi_gian, 
        noidung: h.thao_tac, 
        ten_tuyen: h.tuyen,
        loai_tuyen: h.loai_tuyen
    }));
};

module.exports = { 
    createSchedule, 
    getAllSchedules, 
    updateSchedule,
    deleteSchedule, 
    getAssignmentHistory, // Đổi tên hàm này
    getDriverWeekSchedule, // Đổi tên hàm này
    getMySchedule // Đổi tên hàm này
};