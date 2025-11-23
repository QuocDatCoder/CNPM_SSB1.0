// route.controller.js
const routeService = require('../../services/route.service');

const getAllRoutes = async (req, res) => {
    try {
        const data = await routeService.getAllRoutes();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRouteById = async (req, res) => {
    try {
        const data = await routeService.getRouteById(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getStopsOfRoute = async (req, res) => {
    try {
        const { id } = req.params; 
        const stops = await routeService.getStopsByRouteId(id);
        
        if (!stops || stops.length === 0) {
            return res.status(404).json({ success: false, message: "Tuyến này chưa có trạm nào" });
        }

        res.status(200).json({ success: true, data: stops });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = { getAllRoutes, getRouteById, getStopsOfRoute };