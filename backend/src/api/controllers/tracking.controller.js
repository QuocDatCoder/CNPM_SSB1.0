// Import service xử lý logic
import trackingService from '../../services/tracking.service.js';

export const updateLocation = async (req, res) => {
  try {
    const { busId, lat, lng } = req.body;

    // Gọi service để cập nhật vị trí
    await trackingService.updateLocation(busId, lat, lng);

    res.status(200).json({ message: 'Vị trí xe đã được cập nhật' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStudentStatus = async (req, res) => {
  try {
    const { studentId, status } = req.body;

    // Gọi service để cập nhật trạng thái học sinh
    await trackingService.updateStudentStatus(studentId, status);

    res.status(200).json({ message: 'Trạng thái học sinh đã được cập nhật' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
