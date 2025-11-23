const { User } = require('../data/models');

// 1. Lấy danh sách Tài xế
const getAllDrivers = async () => {
    return await User.findAll({
        where: { vai_tro: 'taixe' },
        attributes: ['id', 'ho_ten', 'so_dien_thoai', 'bang_lai'] 
    });
};

// 2. Tạo nhanh Tài xế (Test)
const createDriverTest = async (data) => {
    return await User.create({
        ...data,
        vai_tro: 'taixe',          // Cứng role
        password_hash: '123456',   // Cứng pass
        trang_thai_taixe: 'hoatdong'
    });
};

module.exports = { getAllDrivers, createDriverTest };