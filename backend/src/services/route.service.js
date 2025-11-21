const { Route } = require('../data/models');

// 1. Thêm tuyến mới
const createRoute = async (data) => {
  try {
    // data = { ten_tuyen: "Tuyến 1", mo_ta: "...", loai_tuyen: "luot_di" }
    const newRoute = await Route.create(data);
    return newRoute;
  } catch (error) {
    throw error;
  }
};

// 2. Lấy tất cả tuyến
const getAllRoutes = async () => {
  try {
    const routes = await Route.findAll();
    return routes;
  } catch (error) {
    throw error;
  }
};

// 3. Lấy chi tiết 1 tuyến
const getRouteById = async (id) => {
  try {
    const route = await Route.findByPk(id);
    return route;
  } catch (error) {
    throw error;
  }
};

// 4. Cập nhật tuyến
const updateRoute = async (id, data) => {
  try {
    const route = await Route.findByPk(id);
    if (!route) return null;
    
    await route.update(data);
    return route;
  } catch (error) {
    throw error;
  }
};

// 5. Xóa tuyến
const deleteRoute = async (id) => {
  try {
    const route = await Route.findByPk(id);
    if (!route) return null;
    
    await route.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = { 
    createRoute, 
    getAllRoutes, 
    getRouteById,
    updateRoute, 
    deleteRoute 
};