const busService = require('../../services/bus.service');

const getAllBuses = async (req, res) => {
    try {
        const buses = await busService.getAllBuses();
        res.status(200).json({ success: true, data: buses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createBus = async (req, res) => {
    try {
        const bus = await busService.createBus(req.body);
        res.status(201).json({ success: true, data: bus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateBus = async (req, res) => {
    try {
        const bus = await busService.updateBus(req.params.id, req.body);
        if (!bus) return res.status(404).json({ success: false, message: "Không tìm thấy xe" });
        res.status(200).json({ success: true, data: bus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteBus = async (req, res) => {
    try {
        const result = await busService.deleteBus(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy xe" });
        res.status(200).json({ success: true, message: "Xóa xe thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllBuses, createBus, updateBus, deleteBus };