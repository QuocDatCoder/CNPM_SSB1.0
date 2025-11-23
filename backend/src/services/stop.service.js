const { Stop } = require('../data/models');

// 1. Thêm trạm mới
const createStop = async (data) => {
    // data = { ten_diem: "Trạm ĐH Sài Gòn", dia_chi: "...", latitude: ..., longitude: ... }
    return await Stop.create(data);
};

// 2. Lấy tất cả trạm
const getAllStops = async () => {
    return await Stop.findAll();
};

// 3. Lấy chi tiết 1 trạm
const getStopById = async (id) => {
    return await Stop.findByPk(id);
};

// 4. Cập nhật trạm
const updateStop = async (id, data) => {
    const stop = await Stop.findByPk(id);
    if (!stop) return null;
    
    await stop.update(data);
    return stop;
};

// 5. Xóa trạm
const deleteStop = async (id) => {
    const stop = await Stop.findByPk(id);
    if (!stop) return null;
    
    await stop.destroy();
    return true;
};

module.exports = { 
    createStop, 
    getAllStops, 
    getStopById, 
    updateStop, 
    deleteStop 
};