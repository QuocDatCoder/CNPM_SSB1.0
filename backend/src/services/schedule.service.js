const { Schedule, Bus, Route, User, AssignmentHistory } = require('../data/models');
const { Op } = require('sequelize');

// 1. Tạo Lịch trình (Có check trùng & Ghi log đầy đủ)
const createSchedule = async (data) => {
    // data = { route_id, driver_id, bus_id, ngay_chay, gio_bat_dau }

    // --- A. LOGIC CHECK TRÙNG ---
    // Check 1: Tài xế này ngày đó có bận không?
    const driverBusy = await Schedule.findOne({
        where: {
            driver_id: data.driver_id,
            ngay_chay: data.ngay_chay
        }
    });
    if (driverBusy) {
        throw new Error(`Tài xế này đã có lịch chạy vào ngày ${data.ngay_chay} rồi!`);
    }

    // Check 2: Xe này ngày đó có ai lấy chưa?
    const busBusy = await Schedule.findOne({
        where: {
            bus_id: data.bus_id,
            ngay_chay: data.ngay_chay
        }
    });
    if (busBusy) {
        throw new Error(`Xe này đã được phân công chạy vào ngày ${data.ngay_chay} rồi!`);
    }

    // --- B. TẠO LỊCH TRÌNH ---
    const newSchedule = await Schedule.create(data);

    // --- C. GHI LỊCH SỬ (Tự động) ---
    try {
        const route = await Route.findByPk(data.route_id);
        const driver = await User.findByPk(data.driver_id);
        
        await AssignmentHistory.create({
            tuyen: route ? route.ten_tuyen : `Tuyến ID ${data.route_id}`,
            // Lưu thêm loại tuyến để sau này lọc Lượt đi/Lượt về
            loai_tuyen: route ? route.loai_tuyen : null, 
            thao_tac: `Thêm phân công cho tài xế ${driver ? driver.ho_ten : ''}`,
            // thoi_gian tự động lấy now
        });
    } catch (err) {
        console.error("Lỗi ghi lịch sử (không ảnh hưởng luồng chính):", err);
    }

    return newSchedule;
};

// 2. Lấy danh sách lịch trình 
const getAllSchedules = async () => {
    return await Schedule.findAll({
        include: [
            { model: Route, attributes: ['ten_tuyen', 'mo_ta', 'loai_tuyen'] },
            { model: Bus, attributes: ['bien_so_xe'] },
            { model: User, as: 'driver', attributes: ['ho_ten', 'so_dien_thoai'] }
        ],
        // Sắp xếp: Ngày mới nhất -> Giờ sớm nhất
        order: [['ngay_chay', 'DESC'], ['gio_bat_dau', 'ASC']]
    });
};

// 3. Xóa lịch trình
const deleteSchedule = async (id) => {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) return null;

    // Lấy thông tin tuyến trước khi xóa để ghi log
    const route = await Route.findByPk(schedule.route_id);

    await schedule.destroy();

    // Ghi log xóa
    try {
        await AssignmentHistory.create({
            tuyen: route ? route.ten_tuyen : 'Tuyến không xác định',
            // Lưu thêm loại tuyến
            loai_tuyen: route ? route.loai_tuyen : null,
            thao_tac: 'Hủy phân công (Xóa lịch)',
        });
    } catch (err) { console.error(err); }

    return true;
};

// 4. Lấy lịch sử thao tác (Hỗ trợ lọc theo Ngày and Loại tuyến)
const getHistory = async (dateStr, typeStr) => {
    let whereClause = {};

    // Lọc theo ngày
    if (dateStr) {
        const start = new Date(dateStr); start.setHours(0,0,0,0);
        const end = new Date(dateStr); end.setHours(23,59,59,999);
        whereClause.thoi_gian = { [Op.between]: [start, end] };
    }

    // Lọc theo loại tuyến (luot_di / luot_ve)
    if (typeStr) {
        whereClause.loai_tuyen = typeStr;
    }

    return await AssignmentHistory.findAll({
        where: whereClause,
        order: [['thoi_gian', 'DESC']],
        limit: 50
    });
};

module.exports = { createSchedule, getAllSchedules, deleteSchedule, getHistory };