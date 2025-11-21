const routeService = require('../../services/route.service');

// API: Tạo tuyến
const createRoute = async (req, res) => {
  try {
    const route = await routeService.createRoute(req.body);
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API: Lấy danh sách
const getRoutes = async (req, res) => {
  try {
    const routes = await routeService.getAllRoutes();
    res.status(200).json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API: Lấy chi tiết
const getRouteById = async (req, res) => {
  try {
    const route = await routeService.getRouteById(req.params.id);
    if (!route) {
        return res.status(404).json({ success: false, message: "Không tìm thấy tuyến" });
    }
    res.status(200).json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API: Cập nhật
const updateRoute = async (req, res) => {
  try {
    const updatedRoute = await routeService.updateRoute(req.params.id, req.body);
    if (!updatedRoute) {
        return res.status(404).json({ success: false, message: "Không tìm thấy tuyến để sửa" });
    }
    res.status(200).json({ success: true, data: updatedRoute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API: Xóa
const deleteRoute = async (req, res) => {
  try {
    const result = await routeService.deleteRoute(req.params.id);
    if (!result) {
        return res.status(404).json({ success: false, message: "Không tìm thấy tuyến để xóa" });
    }
    res.status(200).json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
    createRoute, 
    getRoutes, 
    getRouteById,
    updateRoute, 
    deleteRoute 
};