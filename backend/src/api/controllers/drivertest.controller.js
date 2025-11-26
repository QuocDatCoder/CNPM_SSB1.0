// Import đúng file service mới đổi tên
const driverTestService = require("../../services/drivertest.service");

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
    res
      .status(500)
      .json({ success: false, message: "Lỗi: Username/Email đã tồn tại!" });
  }
};

const updateDriver = async (req, res) => {
  try {
    const driver = await driverTestService.updateDriverTest(
      req.params.id,
      req.body
    );
    if (!driver) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tài xế!" });
    }
    res.status(200).json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDriver = async (req, res) => {
  try {
    await driverTestService.deleteDriverTest(req.params.id);
    res.status(200).json({ success: true, message: "Đã xóa tài xế!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDrivers, createDriver, updateDriver, deleteDriver };
