// Service xử lý logic tracking cho BE2

const { Bus, Student } = require('../data/models'); // Import models từ Sequelize

// Cập nhật vị trí xe buýt
async function updateLocation(busId, lat, lng) {
  try {
    // Lưu vị trí vào DB
    await Bus.update({ lat, lng }, { where: { id: busId } });

    // Phát socket cho client (phụ huynh/admin)
    global.io.emit('busLocationUpdated', { busId, lat, lng });
  } catch (error) {
    throw new Error('Không thể cập nhật vị trí xe: ' + error.message);
  }
}

// Cập nhật trạng thái học sinh (lên/xuống xe)
async function updateStudentStatus(studentId, status) {
  try {
    // Lưu trạng thái vào DB
    await Student.update({ status }, { where: { id: studentId } });

    // Phát socket cho client
    global.io.emit('studentStatusUpdated', { studentId, status });
  } catch (error) {
    throw new Error('Không thể cập nhật trạng thái học sinh: ' + error.message);
  }
}

module.exports = {
  updateLocation,
  updateStudentStatus,
};
