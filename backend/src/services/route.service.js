const { Route } = require('../data/models');

// 1. Tạo tuyến mới
const createRoute = async (data) => {
    // data = { ten_tuyen: '...', mo_ta: '...' }
    return await Route.create(data);
};

// 2. Lấy tất cả tuyến
const getAllRoutes = async () => {
    return await Route.findAll();
};

// 3. Lấy chi tiết 1 tuyến theo ID
const getRouteById = async (id) => {
    return await Route.findByPk(id);
};

// 4. Cập nhật tuyến
const updateRoute = async (id, data) => {
    const route = await Route.findByPk(id);
    if (!route) return null;
    
    await route.update(data);
    return route;
};

// 5. Xóa tuyến
const deleteRoute = async (id) => {
    const route = await Route.findByPk(id);
    if (!route) return null;
    
    await route.destroy();
    return true;
};

module.exports = {
    createRoute,
    getAllRoutes,
    getRouteById,
    updateRoute,
    deleteRoute
};