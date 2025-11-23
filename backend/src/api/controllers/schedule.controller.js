const scheduleService = require('../../services/schedule.service');

const createSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.createSchedule(req.body);
        res.status(201).json({ success: true, data: schedule });
    } catch (error) {
        // Lỗi 400: Bad Request (Do trùng lịch)
        res.status(400).json({ success: false, message: error.message });
    }
};

const getSchedules = async (req, res) => {
    try {
        const schedules = await scheduleService.getAllSchedules();
        res.status(200).json({ success: true, data: schedules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSchedule = async (req, res) => {
    try {
        const result = await scheduleService.deleteSchedule(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.status(200).json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getHistory = async (req, res) => {
    try {
        const { date } = req.query; // Lấy ?date=... từ URL
        const history = await scheduleService.getHistory(date);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createSchedule, getSchedules, deleteSchedule, getHistory };