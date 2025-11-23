const stopService = require('../../services/stop.service');

// API: Lấy danh sách tất cả trạm
const getAllStops = async (req, res) => {
    try {
        const stops = await stopService.getAllStops();
        res.status(200).json({ success: true, data: stops });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Lấy chi tiết 1 trạm (Theo ID)
const getStopById = async (req, res) => {
    try {
        const stop = await stopService.getStopById(req.params.id);
        
        if (!stop) {
            return res.status(404).json({ success: false, message: "Không tìm thấy trạm này" });
        }
        
        res.status(200).json({ success: true, data: stop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllStops, getStopById };