const { Stop } = require('../data/models');

// 1. Lấy tất cả trạm
const getAllStops = async () => {
    try {
        return await Stop.findAll();
    } catch (error) {
        throw error;
    }
};

// 2. Lấy chi tiết 1 trạm
const getStopById = async (id) => {
    try {
        return await Stop.findByPk(id);
    } catch (error) {
        throw error;
    }
};

module.exports = { getAllStops, getStopById };