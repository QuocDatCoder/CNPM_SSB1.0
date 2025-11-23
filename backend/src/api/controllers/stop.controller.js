const stopService = require('../../services/stop.service');

// API: Tạo trạm
const createStop = async (req, res) => {
    try {
        const stop = await stopService.createStop(req.body);
        res.status(201).json({ success: true, data: stop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Lấy danh sách
const getAllStops = async (req, res) => {
    try {
        const stops = await stopService.getAllStops();
        res.status(200).json({ success: true, data: stops });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Lấy chi tiết
const getStopById = async (req, res) => {
    try {
        const stop = await stopService.getStopById(req.params.id);
        if (!stop) return res.status(404).json({ success: false, message: "Không tìm thấy trạm" });
        res.status(200).json({ success: true, data: stop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Cập nhật
const updateStop = async (req, res) => {
    try {
        const updatedStop = await stopService.updateStop(req.params.id, req.body);
        if (!updatedStop) return res.status(404).json({ success: false, message: "Không tìm thấy trạm để sửa" });
        res.status(200).json({ success: true, data: updatedStop });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Xóa
const deleteStop = async (req, res) => {
    try {
        const result = await stopService.deleteStop(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy trạm để xóa" });
        res.status(200).json({ success: true, message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createStop, getAllStops, getStopById, updateStop, deleteStop };