const { errorHandler } = require('../../middlewares/auth.middleware.js');
const trackingService = require('../../services/tracking.service');

//API cap nhat vi tri cho xe
async function updateLocation(req, res) {
  try {
    const { busId, lat, lng } = req.body;
    await trackingService.updateLocation(busId, lat, lng);
    res.json({message: 'Vị trí xe đã được cập nhật'});
  } catch (err){
    res.status(500).json( {message: 'Lỗi cập nhật vị trí', error: err.message });
  }
}

//API cap nhat trang thai hoc sinh
async function updateStudentStatus(req, res) {
  try {
    const { stundentId, status } = req.body;
    await trackingService.updateStudentStatus(stundentId, status);
    res.json( {message: 'Trạng thái học sinh đã được cập nhật', error: err.message});
  } catch {
    res.status(500).json( {message: 'Lỗi cập nhật trạng thái', error: err.message} );
  }
}

module.exports = {
  updateLocation,
  updateStudentStatus,
};