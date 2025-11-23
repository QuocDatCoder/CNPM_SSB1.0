// Import đúng file service mới đổi tên
const driverTestService = require('../../services/drivertest.service');

const getDrivers = async (req, res) => {
    try {
        const drivers = await driverTestService.getAllDrivers();
        res.status(200).json({ success: true, data: drivers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createDriver = async (req, res) => {
    try {
        const driver = await driverTestService.createDriverTest(req.body);
        res.status(201).json({ success: true, data: driver });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi: Username/Email đã tồn tại!" });
    }
};

module.exports = { getDrivers, createDriver };