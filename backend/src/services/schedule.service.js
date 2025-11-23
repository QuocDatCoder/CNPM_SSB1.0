const { Schedule, Bus, Route, User, AssignmentHistory } = require('../data/models');
const { Op } = require('sequelize');

// 1. Tạo Lịch trình (Có check trùng & Ghi log)
const createSchedule = async (data) => {
    // --- A. LOGIC CHECK TRÙNG ---
    // Check 1: Tài xế
    const driverBusy = await Schedule.findOne({
        where: {
            driver_id: data.driver_id,
            ngay_chay: data.ngay_chay
        }
    });
    if (driverBusy) {
        throw new Error(`Tài xế này đã có lịch chạy vào ngày ${data.ngay_chay} rồi!`);
    }

    // Check 2: Xe
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
        order: [['ngay_chay', 'DESC'], ['gio_bat_dau', 'ASC']]
    });
};

// 3. Xóa lịch trình
const deleteSchedule = async (id) => {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) return null;

    const route = await Route.findByPk(schedule.route_id);

    await schedule.destroy();

    // Ghi log xóa
    try {
        await AssignmentHistory.create({
            tuyen: route ? route.ten_tuyen : 'Tuyến không xác định',
            thao_tac: 'Hủy phân công (Xóa lịch)',
        });
    } catch (err) { console.error(err); }

    return true;
};

// 4. Lấy lịch sử thao tác (Hỗ trợ lọc theo ngày)
const getHistory = async (dateStr) => {
    let whereClause = {};
    if (dateStr) {
        const start = new Date(dateStr); start.setHours(0,0,0,0);
        const end = new Date(dateStr); end.setHours(23,59,59,999);
        whereClause = { thoi_gian: { [Op.between]: [start, end] } };
    }

    return await AssignmentHistory.findAll({
        where: whereClause,
        order: [['thoi_gian', 'DESC']],
        limit: 50
    });
};

module.exports = { createSchedule, getAllSchedules, deleteSchedule, getHistory };