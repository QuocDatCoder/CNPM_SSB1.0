const scheduleService = require('../../services/schedule.service');

// API: Phân công lịch chạy
const createSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.createSchedule(req.body);
        res.status(201).json({ success: true, data: schedule });
    } catch (error) {
        // Trả về lỗi 400 (Bad Request) nếu bị trùng lịch
        res.status(400).json({ success: false, message: error.message });
    }
};

// API: Lấy danh sách lịch trình (Dashboard)
const getSchedules = async (req, res) => {
    try {
        const schedules = await scheduleService.getAllSchedules();
        res.status(200).json({ success: true, data: schedules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Xóa lịch trình
const deleteSchedule = async (req, res) => {
    try {
        const result = await scheduleService.deleteSchedule(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình' });
        res.status(200).json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Lấy lịch sử thao tác (Updated)
const getHistory = async (req, res) => {
    try {
        // Lấy tham số từ URL
        // Ví dụ: ?date=2025-11-23&type=luot_di
        const { date, type } = req.query; 
        
        const history = await scheduleService.getHistory(date, type);
        
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createSchedule, getSchedules, deleteSchedule, getHistory };