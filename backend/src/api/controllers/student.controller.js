const studentService = require('../../services/student.service');

// [GET] /api/students
const getAllStudents = async (req, res) => {
    try {
        const data = await studentService.getAllStudents();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [POST] /api/students/with-parent (Tạo HS kèm Phụ huynh mới)
const createStudentWithParent = async (req, res) => {
    try {
        const data = await studentService.createStudentWithParent(req.body);
        res.status(201).json({ 
            success: true, 
            message: "Đã tạo hồ sơ Học sinh và Phụ huynh thành công!", 
            data 
        });
    } catch (error) {
        // Xử lý lỗi trùng lặp (User/Email/SĐT đã tồn tại)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                success: false, 
                message: "Email hoặc Số điện thoại phụ huynh đã tồn tại trên hệ thống!" 
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// [PUT] /api/students/:id
const updateStudent = async (req, res) => {
    try {
        const data = await studentService.updateStudent(req.params.id, req.body);
        if (!data) {
            return res.status(404).json({ success: false, message: "Không tìm thấy học sinh" });
        }
        res.status(200).json({ success: true, message: "Cập nhật thành công", data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [DELETE] /api/students/:id
const deleteStudent = async (req, res) => {
    try {
        const result = await studentService.deleteStudent(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: "Không tìm thấy học sinh" });
        }
        res.status(200).json({ success: true, message: "Xóa học sinh thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    getAllStudents, 
    createStudentWithParent,
    updateStudent, 
    deleteStudent 
};