--
-- Seeder (Gieo dữ liệu) cho CSDL smart_bus_tracking_optimized
-- *** ĐÃ CẬP NHẬT (v2) ĐỂ KHỚP VỚI THIẾT KẾ FIGMA ***
--
-- Mật khẩu mặc định cho các tài khoản mẫu là: 'user123'
-- Mật khẩu cho admin là: 'admin123'
--
-- Hash cho 'admin123': $2a$10$wE.L4g/CVi3505mRfsAL5.LwG0W7KE4D/G0RzFz.z.j8G.0t4/t.O
-- Hash cho 'user123' (ví dụ):  $2a$10$f/A.Q.sY./N10A.W.J/0m.0F0A.A.a/A.a/A.a/A.a/A.a/A
--

USE `smart_bus_tracking_optimized`;
START TRANSACTION;

-- --------------------------------------------------------
-- Bảng 1: Users (1 Admin, 2 Tài xế, 2 Phụ huynh)
-- --------------------------------------------------------
INSERT INTO `Users` (`id`, `username`, `email`, `password_hash`, `ho_ten`, `so_dien_thoai`, `vai_tro`, `dia_chi`, `bang_lai`, `trang_thai_taixe`) VALUES
(1, 'admin', 'admin@ssb.com', '$2a$10$wE.L4g/CVi3505mRfsAL5.LwG0W7KE4D/G0RzFz.z.j8G.0t4/t.O', 'Quản Trị Viên', '0900000001', 'admin', 'Văn phòng trường', NULL, NULL),
(2, 'taixe1', 'taixe1@ssb.com', '$2a$10$f/A.Q.sY./N10A.W.J/0m.0F0A.A.a/A.a/A.a/A.a/A.a/A', 'Nguyễn Văn Tài', '0900000002', 'taixe', NULL, 'B2', 'hoatdong'),
(3, 'taixe2', 'taixe2@ssb.com', '$2a$10$f/A.Q.sY./N10A.W.J/0m.0F0A.A.a/A.a/A.a/A.a/A.a/A', 'Trần B', '0900000003', 'taixe', NULL, 'C1', 'hoatdong'),
(4, 'phuhuynh1', 'phuhuynh1@ssb.com', '$2a$10$f/A.Q.sY./N10A.W.J/0m.0F0A.A.a/A.a/A.a/A.a/A.a/A', 'Phụ Huynh A', '0900000004', 'phuhuynh', '123 Nguyễn Trãi, Q1', NULL, NULL),
(5, 'phuhuynh2', 'phuhuynh2@ssb.com', '$2a$10$f/A.Q.sY./N10A.W.J/0m.0F0A.A.a/A.a/A.a/A.a/A.a/A', 'Phụ Huynh B', '0900000005', 'phuhuynh', '456 Lê Lợi, Q.Thủ Đức', NULL, NULL)
ON DUPLICATE KEY UPDATE `email` = `email`;

-- --------------------------------------------------------
-- Bảng 2: Buses (2 xe buýt)
-- --------------------------------------------------------
INSERT INTO `Buses` (`id`, `bien_so_xe`, `so_ghe`, `trang_thai`) VALUES
(1, '51A-123.45', 30, 'hoatdong'),
(2, '51A-678.90', 25, 'hoatdong')
ON DUPLICATE KEY UPDATE `bien_so_xe` = `bien_so_xe`;

-- --------------------------------------------------------
-- Bảng 3: Stops (4 điểm dừng)
-- --------------------------------------------------------
INSERT INTO `Stops` (`id`, `ten_diem`, `dia_chi`, `latitude`, `longitude`) VALUES
(1, 'KTX Khu A ĐHQG', 'Đ. Tạ Quang Bửu, Đông Hoà, Dĩ An', 10.8827, 106.8045),
(2, 'Ngã tư Thủ Đức', 'Ngã tư Thủ Đức, P. Hiệp Phú, Q9', 10.8500, 106.7723),
(3, 'Trường THPT Marie Curie', '157 Nam Kỳ Khởi Nghĩa, P.Võ Thị Sáu, Q3', 10.7846, 106.6859),
(4, 'Công viên Lê Văn Tám', 'Đ. Hai Bà Trưng, Đa Kao, Q1', 10.7890, 106.6901)
ON DUPLICATE KEY UPDATE `ten_diem` = `ten_diem`;

-- --------------------------------------------------------
-- Bảng 4: Routes (2 tuyến)
-- --------------------------------------------------------
INSERT INTO `Routes` (`id`, `ten_tuyen`, `mo_ta`) VALUES
(1, 'Tuyến 1 - Sáng (Dĩ An -> Q3)', 'Tuyến đón học sinh buổi sáng từ KTX Khu A đến Marie Curie.'),
(2, 'Tuyến 2 - Sáng (Thủ Đức -> Q1)', 'Tuyến đón học sinh buổi sáng từ Ngã tư Thủ Đức đến CV Lê Văn Tám.')
ON DUPLICATE KEY UPDATE `ten_tuyen` = `ten_tuyen`;

-- --------------------------------------------------------
-- Bảng 5: RouteStops (Các điểm dừng cho 2 tuyến)
-- --------------------------------------------------------
INSERT INTO `RouteStops` (`route_id`, `stop_id`, `thu_tu`, `gio_don_du_kien`) VALUES
(1, 1, 1, '06:30:00'), -- Tuyến 1, Dừng 1 (KTX)
(1, 3, 2, '07:00:00'), -- Tuyến 1, Dừng 2 (Marie Curie)
(2, 2, 1, '06:45:00'), -- Tuyến 2, Dừng 1 (Ngã tư Thủ Đức)
(2, 4, 2, '07:15:00')  -- Tuyến 2, Dừng 2 (CV Lê Văn Tám)
ON DUPLICATE KEY UPDATE `stop_id` = `stop_id`;

-- --------------------------------------------------------
-- Bảng 6: Students (3 học sinh)
-- *** CẬP NHẬT: Thêm ngay_sinh, gioi_tinh, gvcn từ Figma ***
-- --------------------------------------------------------
INSERT INTO `Students` (`id`, `ho_ten`, `lop`, `parent_id`, `default_stop_id`, `ngay_sinh`, `gioi_tinh`, `gvcn`) VALUES
(1, 'Nguyễn Văn An', '6A1', 4, 1, '2015-01-10', 'Nam', 'Cô Lan'),
(2, 'Trần Thị Bình', '7B2', 5, 2, '2014-05-20', 'Nữ', 'Thầy Hùng'),
(3, 'Lê Văn Cường', '6A1', 4, 3, '2015-03-15', 'Nam', 'Cô Lan')
ON DUPLICATE KEY UPDATE `ho_ten` = `ho_ten`;

-- --------------------------------------------------------
-- Bảng 7: Schedules (Phân công 2 chuyến cho HÔM NAY)
-- --------------------------------------------------------
INSERT INTO `Schedules` (`id`, `route_id`, `driver_id`, `bus_id`, `ngay_chay`, `trang_thai`) VALUES
(1, 1, 2, 1, CURDATE(), 'chuabatdau'), -- Chuyến 1 (Tuyến 1), Tài xế 1, Xe 1, Hôm nay, Chưa bắt đầu
(2, 2, 3, 2, CURDATE(), 'dangchay')  -- Chuyến 2 (Tuyến 2), Tài xế 2, Xe 2, Hôm nay, Đang chạy
ON DUPLICATE KEY UPDATE `route_id` = `route_id`;

-- ---------------------------------------------------------
-- Bảng 8: ScheduleStudents (Điểm danh học sinh cho 2 chuyến)
-- *** ĐÃ CẬP NHẬT: Đã bỏ cột seat_id ***
-- --------------------------------------------------------
INSERT INTO `ScheduleStudents` (`schedule_id`, `student_id`, `stop_id`, `trang_thai_don`) VALUES
-- Học sinh cho Chuyến 1 (Đi xe 1)
(1, 1, 1, 'choxacnhan'), -- Em An, đi chuyến 1, đón ở điểm 1 (KTX)
(1, 3, 3, 'choxacnhan'), -- Em Cường, đi chuyến 1, đón ở điểm 3 (Marie Curie)
-- Học sinh cho Chuyến 2 (Đi xe 2)
(2, 2, 2, 'dihoc')       -- Em Bình, đi chuyến 2, đón ở điểm 2 (Thủ Đức), đã được đón
ON DUPLICATE KEY UPDATE `trang_thai_don` = `trang_thai_don`;

-- --------------------------------------------------------
-- Bảng 9: LocationHistory (Mô phỏng 3 điểm vị trí cho Chuyến 2 đang chạy)
-- --------------------------------------------------------
INSERT INTO `LocationHistory` (`schedule_id`, `latitude`, `longitude`, `timestamp`) VALUES
(2, 10.8495, 106.7720, NOW() - INTERVAL 5 MINUTE), -- Vị trí 5 phút trước
(2, 10.8472, 106.7710, NOW() - INTERVAL 2 MINUTE), -- Vị trí 2 phút trước
(2, 10.8450, 106.7700, NOW()) -- Vị trí hiện tại
ON DUPLICATE KEY UPDATE `timestamp` = `timestamp`;

-- --------------------------------------------------------
-- Bảng 10: Notifications (Tạo 3 thông báo mẫu)
-- --------------------------------------------------------
INSERT INTO `Notifications` (`user_id_gui`, `user_id_nhan`, `schedule_id`, `noi_dung`, `loai`, `da_doc`) VALUES
(1, 4, NULL, 'Xin chào, vui lòng cập nhật thông tin địa chỉ cho bé An.', 'tinnhan', 0), -- Admin gửi Phụ huynh 1
(3, 1, 2, 'Xe 51A-678.90 bị kẹt xe nhẹ tại Ngã tư Thủ Đức, dự kiến trễ 5 phút.', 'suco_taixe', 0), -- Tài xế 2 báo cáo sự cố cho Admin
(NULL, 5, 2, 'Xe buýt chở em Trần Thị Bình sắp đến điểm đón (Ngã tư Thủ Đức).', 'canhbao_sapden', 0) -- Hệ thống gửi cảnh báo cho Phụ huynh 2
ON DUPLICATE KEY UPDATE `noi_dung` = `noi_dung`;


COMMIT;
