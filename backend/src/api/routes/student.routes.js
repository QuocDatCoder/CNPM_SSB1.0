const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');

// 1. Lấy danh sách (Hiển thị bảng)
router.get('/', studentController.getAllStudents);

// 3. Thêm học sinh KÈM Phụ huynh mới (Cách mới - Dùng cho form "2 trong 1")
router.post('/with-parent', studentController.createStudentWithParent);

// 4. Cập nhật thông tin
router.put('/:id', studentController.updateStudent);

// 5. Xóa học sinh
router.delete('/:id', studentController.deleteStudent);

module.exports = router;