const { Student, User, RouteStop, Stop, Route, ScheduleStudent, Schedule ,sequelize } = require('../data/models');
const { Op } = require('sequelize');


// 1. Lấy danh sách học sinh
const getAllStudents = async () => {
    try {
        const students = await Student.findAll({
            include: [
                {
                    model: User,
                    as: 'parent', 
                    attributes: ['id', 'ho_ten', 'so_dien_thoai', 'email', 'dia_chi']
                },
                {
                    model: RouteStop,
                    as: 'defaultRouteStop', 
                    include: [
                        {
                            model: Stop,
                            as: 'Stop',
                            attributes: ['id', 'ten_diem', 'dia_chi']
                        },
                        {
                            model: Route,
                            as: 'Route',
                            attributes: ['id', 'ten_tuyen']
                        }
                    ]
                }
            ],
            order: [['id', 'DESC']]
        });

        return students.map(student => {
            const parent = student.parent || {};
            const routeStop = student.defaultRouteStop || {};
            const stop = routeStop.Stop || routeStop.stop || {};
            const route = routeStop.Route || routeStop.route || {};

            return {
                id: student.id,
                ho_ten: student.ho_ten,
                lop: student.lop,
                ngay_sinh: student.ngay_sinh,
                gioi_tinh: student.gioi_tinh, 
                gvcn: student.gvcn,
                
                // Thông tin Phụ huynh
                parent_id: student.parent_id,
                ten_phu_huynh: parent.ho_ten || "Chưa cập nhật",
                sdt_phu_huynh: parent.so_dien_thoai || "",
                email_phu_huynh: parent.email || "",
                dia_chi: parent.dia_chi || "",

                // Thông tin Tuyến/Trạm (Lấy từ RouteStop)
                tram_don: stop.ten_diem || "Chưa đăng ký",
                dia_chi_tram: stop.dia_chi || "",
                tuyen_duong: route.ten_tuyen || "Chưa đăng ký",

                default_route_stop_id: student.default_route_stop_id, 
                current_route_id: route.id || null, 
                current_stop_id: stop.id || null
            };
        });

    } catch (error) {
        console.error("Lỗi getAllStudents:", error);
        throw error;
    }
};
const autoAssignToSchedule = async (studentId, routeId, stopId, transaction) => {
    try {
        // 1. Tìm route_stop_id tương ứng
        const routeStop = await RouteStop.findOne({
            where: { route_id: routeId, stop_id: stopId },
            transaction
        });

        if (!routeStop) {
            console.warn(`Không tìm thấy RouteStop cho Route ${routeId} và Stop ${stopId}`);
            return; 
        }

        // 2. Tìm các lịch trình phù hợp
        const today = new Date();
        today.setHours(0,0,0,0);

        const schedules = await Schedule.findAll({
            where: {
                route_id: routeId,
                ngay_chay: { [Op.gte]: today },
                trang_thai: { [Op.ne]: 'hoanthanh' }
            },
            transaction
        });

        if (schedules.length === 0) return;

        // 3. Gán học sinh vào từng lịch trình
        for (const schedule of schedules) {
        await ScheduleStudent.findOrCreate({
            where: {
                schedule_id: schedule.id,
                student_id: studentId
            },
            defaults: {
                stop_id: routeStop.stop_id,  // đúng cột
                trang_thai_don: 'choxacnhan'
            },
            transaction
        });
    }


    } catch (error) {
        console.error("Lỗi tự động gán lịch trình:", error);
    }
};

// 3. Tạo Học sinh KÈM Phụ huynh (Logic thông minh có transaction)
const createStudentWithParent = async (data) => {
    const transaction = await sequelize.transaction();

    try {
        let parentId = null;
        let parent = null;

        // ... (Logic xử lý Phụ huynh giữ nguyên như cũ) ...
        // B1: Kiểm tra hoặc tạo mới Phụ huynh
        const existingParent = await User.findOne({
            where: { so_dien_thoai: data.sdt_ph },
            transaction
        });

        if (existingParent) {
            parent = existingParent;
            parentId = existingParent.id;
        } else {
            parent = await User.create({
                username: data.username || data.sdt_ph,
                email: data.email_ph,
                password_hash: data.password || '123456', // Hash password thực tế ở đây
                ho_ten: data.ho_ten_ph,
                so_dien_thoai: data.sdt_ph,
                dia_chi: data.dia_chi,
                vai_tro: 'phuhuynh',
            }, { transaction });
            parentId = parent.id;
        }

        // --- BƯỚC 2: TÌM route_stop_id ĐỂ LƯU VÀO STUDENT ---
        // (Lưu ý: Bảng Student mới của bạn dùng default_route_stop_id)
        let defaultRouteStopId = null;
        if (data.route_id && data.stop_id) {
            const routeStop = await RouteStop.findOne({
                where: { route_id: data.route_id, stop_id: data.stop_id },
                transaction
            });
            if (routeStop) {
                defaultRouteStopId = routeStop.id;
            }
        }

        // --- BƯỚC 3: TẠO HỌC SINH ---
        const student = await Student.create({
            ho_ten: data.ho_ten_hs,
            lop: data.lop,
            ngay_sinh: data.ngay_sinh,
            gioi_tinh: data.gioi_tinh,
            gvcn: data.gvcn,
            parent_id: parentId,
            default_route_stop_id: defaultRouteStopId // Lưu ID RouteStop
        }, { transaction });

        // --- BƯỚC 4: GỌI HÀM TỰ ĐỘNG GÁN VÀO LỊCH TRÌNH ---
        // Nếu có đủ thông tin tuyến và trạm, thực hiện gán
        if (data.route_id && data.stop_id) {
            await autoAssignToSchedule(student.id, data.route_id, data.stop_id, transaction);
        }

        await transaction.commit();
        return { student, parent };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// 3. Sửa thông tin học sinh
const updateStudent = async (id, data) => {
    try {
        const student = await Student.findByPk(id);
        if (!student) throw new Error('Học sinh không tồn tại');

        if (data.route_id !== undefined && data.stop_id !== undefined) {
             const routeStop = await RouteStop.findOne({
                where: {
                    route_id: data.route_id,
                    stop_id: data.stop_id
                }
            });
            data.default_route_stop_id = routeStop ? routeStop.id : null;
        }

        await student.update(data);
        return student;
    } catch (error) {
        throw error;
    }
};

// 4. Xóa học sinh
const deleteStudent = async (id) => {
    try {
        const student = await Student.findByPk(id);
        if (!student) throw new Error('Học sinh không tồn tại');
        
        await student.destroy();
        return true;
    } catch (error) {
        throw error;
    }
};

module.exports = { 
    getAllStudents, 
    createStudentWithParent,
    updateStudent, 
    deleteStudent 
};