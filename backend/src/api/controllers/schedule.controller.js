const scheduleService = require('../../services/schedule.service');

// 1. Phân công lịch chạy
const createSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.createSchedule(req.body);
        res.status(201).json({ success: true, data: schedule });
    } catch (error) {
        // Lỗi 400: Bad Request (Thường do trùng lịch)
        res.status(400).json({ success: false, message: error.message });
    }
};

// 2. Lấy danh sách lịch trình (Bảng Dashboard)
const getSchedules = async (req, res) => {
    try {
        const schedules = await scheduleService.getAllSchedules();
        res.status(200).json({ success: true, data: schedules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// 2. Cập nhật
const updateSchedule = async (req, res) => {
    try {
        const data = await scheduleService.updateSchedule(req.params.id, req.body);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
// 3. Xóa lịch trình
const deleteSchedule = async (req, res) => {
    try {
        const result = await scheduleService.deleteSchedule(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình' });
        }
        res.status(200).json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Lấy lịch sử thao tác (Log)
const getHistory = async (req, res) => {
    try {
        // Lấy tham số lọc: ?date=...&type=...
        const { date, type } = req.query; 
        const history = await scheduleService.getHistory(date, type);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. API Admin xem lịch Tài xế (Dạng Tuần)
const getAdminWeekSchedule = async (req, res) => {
    try {
        // Không cần lấy driverId từ params nữa
        const data = await scheduleService.getAdminWeekSchedule(); 
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. API App Tài xế xem lịch mình (Dạng Ngày)
const getScheduleDriverApp = async (req, res) => {
    try {
        const { driverId } = req.params;
        const data = await scheduleService.getScheduleForDriverApp(driverId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    createSchedule, 
    getSchedules, 
    updateSchedule,
    deleteSchedule, 
    getHistory,
    getAdminWeekSchedule,
    getScheduleDriverApp
};