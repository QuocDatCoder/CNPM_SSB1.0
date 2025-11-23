const { Bus } = require('../data/models');

// 1. Lấy danh sách tất cả xe 
const getAllBuses = async () => {
    return await Bus.findAll();
};

// 2. Thêm xe mới
const createBus = async (data) => {
    return await Bus.create(data);
};

// 3. Sửa thông tin xe 
const updateBus = async (id, data) => {
    const bus = await Bus.findByPk(id);
    if (!bus) return null;
    await bus.update(data);
    return bus;
};

// 4. Xóa xe 
const deleteBus = async (id) => {
    const bus = await Bus.findByPk(id);
    if (!bus) return null;
    await bus.destroy();
    return true;
};

module.exports = { getAllBuses, createBus, updateBus, deleteBus };