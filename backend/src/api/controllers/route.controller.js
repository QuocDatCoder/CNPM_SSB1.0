const routeService = require('../../services/route.service');

// [POST] /api/routes
const createRoute = async (req, res) => {
    try {
        const newRoute = await routeService.createRoute(req.body);
        res.status(201).json({ success: true, data: newRoute });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] /api/routes
const getAllRoutes = async (req, res) => {
    try {
        const routes = await routeService.getAllRoutes();
        res.status(200).json({ success: true, data: routes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] /api/routes/:id
const getRouteById = async (req, res) => {
    try {
        const route = await routeService.getRouteById(req.params.id);
        if (!route) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tuyến đường' });
        }
        res.status(200).json({ success: true, data: route });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [PUT] /api/routes/:id
const updateRoute = async (req, res) => {
    try {
        const updatedRoute = await routeService.updateRoute(req.params.id, req.body);
        if (!updatedRoute) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tuyến đường để sửa' });
        }
        res.status(200).json({ success: true, data: updatedRoute });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [DELETE] /api/routes/:id
const deleteRoute = async (req, res) => {
    try {
        const result = await routeService.deleteRoute(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tuyến đường để xóa' });
        }
        res.status(200).json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createRoute,
    getAllRoutes,
    getRouteById,
    updateRoute,
    deleteRoute
};