-- ========================================================
-- DỮ LIỆU MẪU CHO SMART BUS TRACKING (OPTIMIZED)
-- ========================================================

-- 1. THÊM USERS (1 Admin, 5 Tài xế, 14 Phụ huynh)
-- Password demo: '123456' (Trong thực tế sẽ được mã hóa)
INSERT INTO `Users` 
(`driver_code`, `parent_code`, `username`, `email`, `password_hash`, `ho_ten`, `ngay_sinh`, `gioi_tinh`, `so_dien_thoai`, `vai_tro`, `dia_chi`, `bang_lai`, `trang_thai_taixe`)
VALUES
-- Admin
(NULL, NULL, 'admin', 'admin@sbms.com', '123456', 'Quản Trị Viên', NULL, NULL, '0909000001', 'admin', 'TP.HCM', NULL, NULL),

-- 5 Tài xế
(1, NULL, 'taixe1', 'taixe1@sbms.com', '123456', 'Nguyễn Văn Bác', NULL, 'Nam', '0909000002', 'taixe', 'Q.1, TP.HCM', 'Hạng E', 'Đang hoạt động'),
(2, NULL, 'taixe2', 'taixe2@sbms.com', '123456', 'Trần Văn Tài', NULL, 'Nam', '0909000003', 'taixe', 'Q.3, TP.HCM', 'Hạng E', 'Đang hoạt động'),
(3, NULL, 'taixe3', 'taixe3@sbms.com', '123456', 'Lê Văn Xế', NULL, 'Nam', '0909000004', 'taixe', 'Q.5, TP.HCM', 'Hạng D', 'Đang hoạt động'),
(4, NULL, 'taixe4', 'taixe4@sbms.com', '123456', 'Phạm Văn Lái', NULL, 'Nam', '0909000005', 'taixe', 'Q.10, TP.HCM', 'Hạng E', 'Nghỉ'),
(5, NULL, 'taixe5', 'taixe5@sbms.com', '123456', 'Hoàng Văn Xe', NULL, 'Nam', '0909000006', 'taixe', 'Q.TB, TP.HCM', 'Hạng E', 'Tạm dừng'),

-- 14 Phụ huynh
(NULL, 1, 'ph1', 'ph1@gmail.com', '123456', 'Nguyễn Thị Mẹ A', NULL, 'Nữ', '0911000001', 'phuhuynh', 'Q.1, TP.HCM', NULL, NULL),
(NULL, 2, 'ph2', 'ph2@gmail.com', '123456', 'Trần Văn Ba B', NULL, 'Nam', '0911000002', 'phuhuynh', 'Q.3, TP.HCM', NULL, NULL),
(NULL, 3, 'ph3', 'ph3@gmail.com', '123456', 'Lê Thị Mẹ C', NULL, 'Nữ', '0911000003', 'phuhuynh', 'Q.5, TP.HCM', NULL, NULL),
(NULL, 4, 'ph4', 'ph4@gmail.com', '123456', 'Phạm Văn Ba D', NULL, 'Nam', '0911000004', 'phuhuynh', 'Q.10, TP.HCM', NULL, NULL),
(NULL, 5, 'ph5', 'ph5@gmail.com', '123456', 'Hoàng Thị Mẹ E', NULL, 'Nữ', '0911000005', 'phuhuynh', 'Q.TB, TP.HCM', NULL, NULL),
(NULL, 6, 'ph6', 'ph6@gmail.com', '123456', 'Vũ Văn Ba F', NULL, 'Nam', '0911000006', 'phuhuynh', 'TP.Thủ Đức', NULL, NULL),
(NULL, 7, 'ph7', 'ph7@gmail.com', '123456', 'Đặng Thị Mẹ G', NULL, 'Nữ', '0911000007', 'phuhuynh', 'Q.7, TP.HCM', NULL, NULL),
(NULL, 8, 'ph8', 'ph8@gmail.com', '123456', 'Bùi Văn Ba H', NULL, 'Nam', '0911000008', 'phuhuynh', 'Q.8, TP.HCM', NULL, NULL),
(NULL, 9, 'ph9', 'ph9@gmail.com', '123456', 'Đỗ Thị Mẹ I', NULL, 'Nữ', '0911000009', 'phuhuynh', 'Q.12, TP.HCM', NULL, NULL),
(NULL, 10, 'ph10', 'ph10@gmail.com', '123456', 'Hồ Văn Ba K', NULL, 'Nam', '0911000010', 'phuhuynh', 'Hóc Môn', NULL, NULL),
(NULL, 11, 'ph11', 'ph11@gmail.com', '123456', 'Ngô Thị Mẹ L', NULL, 'Nữ', '0911000011', 'phuhuynh', 'Củ Chi', NULL, NULL),
(NULL, 12, 'ph12', 'ph12@gmail.com', '123456', 'Dương Văn Ba M', NULL, 'Nam', '0911000012', 'phuhuynh', 'Bình Chánh', NULL, NULL),
(NULL, 13, 'ph13', 'ph13@gmail.com', '123456', 'Lý Thị Mẹ N', NULL, 'Nữ', '0911000013', 'phuhuynh', 'Nhà Bè', NULL, NULL),
(NULL, 14, 'ph14', 'ph14@gmail.com', '123456', 'Vương Văn Ba O', NULL, 'Nam', '0911000014', 'phuhuynh', 'Cần Giờ', NULL, NULL);

-- --------------------------------------------------------

-- 2. THÊM XE BUÝT (10 Xe)
INSERT INTO `Buses` (`bien_so_xe`, `hang_xe`, `nam_san_xuat`, `so_ghe`, `so_km_da_chay`, `lich_bao_duong`, `trang_thai`) VALUES
('59B-000.01', 'Hyundai', 2022, 45, 15000.50, '2025-12-01', 'Đang hoạt động'),
('59B-000.02', 'Thaco', 2021, 45, 25000.00, '2025-11-15', 'Đang hoạt động'),
('59B-000.03', 'Samco', 2020, 30, 40000.20, '2025-10-20', 'Ngừng'),
('59B-000.04', 'Hyundai', 2023, 45, 5000.00, '2026-01-01', 'Ngừng'),
('59B-000.05', 'Thaco', 2019, 30, 60000.00, '2025-09-30', 'Bảo trì'),
('50E-111.11', 'Samco', 2022, 30, 12000.00, '2025-12-10', 'Ngừng'),
('50E-222.22', 'Hyundai', 2021, 45, 22000.00, '2025-11-25', 'Ngừng'),
('50E-333.33', 'Thaco', 2020, 45, 35000.00, '2025-10-05', 'Ngừng'),
('50E-444.44', 'Samco', 2023, 30, 8000.00, '2026-02-15', 'Ngừng'),
('50E-555.55', 'VinBus', 2024, 50, 2000.00, '2026-05-20', 'Ngừng');

-- --------------------------------------------------------

-- 3. THÊM TRẠM DỪNG (10 Trạm)
INSERT INTO `Stops` (`ten_diem`, `dia_chi`, `latitude`, `longitude`) VALUES
('Trạm Bến Thành', 'Công trường Quách Thị Trang, Q.1', 10.77210000, 106.69830000),
('Trạm ĐH Sài Gòn', '273 An Dương Vương, Q.5', 10.75990000, 106.68220000),
('Trạm ĐH Sư Phạm', '280 An Dương Vương, Q.5', 10.76100000, 106.68300000),
('Trạm Hùng Vương', '126 Hùng Vương, Q.5', 10.75800000, 106.67500000),
('Trạm Thuận Kiều', '190 Hồng Bàng, Q.5', 10.75500000, 106.66500000),
('Trạm KTX Khu B', 'ĐHQG, Dĩ An', 10.88200000, 106.78000000),
('Trạm Suối Tiên', 'Xa lộ Hà Nội, TP.Thủ Đức', 10.86500000, 106.80000000),
('Trạm Ngã 4 Thủ Đức', 'Ngã 4 Thủ Đức', 10.85000000, 106.77000000),
('Trạm Hàng Xanh', 'Ngã 4 Hàng Xanh, Bình Thạnh', 10.80200000, 106.71500000),
('Trạm Thảo Cầm Viên', '2 Nguyễn Bỉnh Khiêm, Q.1', 10.78700000, 106.70500000);

-- --------------------------------------------------------

-- 4. THÊM 6 TUYẾN ĐƯỜNG (3 Cặp Tuyến x 2 Chiều)
INSERT INTO `Routes` (`ten_tuyen`, `mo_ta`, `khoang_cach`, `thoi_gian_du_kien`, `loai_tuyen`) VALUES
-- Cặp 1: Tuyến 1 (Q1 - Q5)
('Tuyến 1: Q1 - Q5', 'Từ Bến Thành đi An Dương Vương', 5.5, 30, 'luot_di'),
('Tuyến 1: Q5 - Q1', 'Từ An Dương Vương về Bến Thành', 5.5, 30, 'luot_ve'),

-- Cặp 2: Tuyến 2 (KTX - Q1)
('Tuyến 2: KTX - Q1', 'Từ KTX Khu B đến Thảo Cầm Viên', 20.0, 60, 'luot_di'),
('Tuyến 2: Q1 - KTX', 'Từ Thảo Cầm Viên về KTX Khu B', 20.0, 60, 'luot_ve'),

-- Cặp 3: Tuyến 3 (Thủ Đức - Bình Thạnh)
('Tuyến 3: Thủ Đức - Hàng Xanh', 'Lộ trình: Ngã 4 Thủ Đức đi Hàng Xanh', 12.5, 45, 'luot_di'),
('Tuyến 3: Hàng Xanh - Thủ Đức', 'Lộ trình: Hàng Xanh về Ngã 4 Thủ Đức', 12.5, 45, 'luot_ve');

-- --------------------------------------------------------

-- GÁN TRẠM CHO CÁC TUYẾN (RouteStops)
-- Giả sử ID Route lần lượt là 1, 2, 3, 4, 5, 6

-- === TUYẾN 1 (Bến Thành - ĐH Sài Gòn) ===
INSERT INTO `RouteStops` (`route_id`, `stop_id`, `thu_tu`, `gio_don_du_kien`) VALUES
(1, 1, 1, '06:00:00'), -- Bến Thành
(1, 2, 2, '06:15:00'), -- ĐH Sài Gòn
(1, 3, 3, '06:20:00'), -- ĐH Sư Phạm
(1, 5, 4, '06:30:00'); -- Thuận Kiều

INSERT INTO `RouteStops` (`route_id`, `stop_id`, `thu_tu`, `gio_don_du_kien`) VALUES
(2, 5, 1, '17:00:00'), -- Thuận Kiều
(2, 3, 2, '17:10:00'), -- ĐH Sư Phạm
(2, 2, 3, '17:15:00'), -- ĐH Sài Gòn
(2, 1, 4, '17:30:00'); -- Bến Thành

-- === TUYẾN 2 (KTX Khu B - Thảo Cầm Viên) ===
INSERT INTO `RouteStops` (`route_id`, `stop_id`, `thu_tu`, `gio_don_du_kien`) VALUES
(3, 6, 1, '05:30:00'), -- KTX Khu B
(3, 7, 2, '05:45:00'), -- Suối Tiên
(3, 9, 3, '06:10:00'), -- Hàng Xanh
(3, 10, 4, '06:30:00'); -- Thảo Cầm Viên

INSERT INTO `RouteStops` (`route_id`, `stop_id`, `thu_tu`, `gio_don_du_kien`) VALUES
(4, 10, 1, '16:30:00'), -- Thảo Cầm Viên
(4, 9, 2, '16:50:00'), -- Hàng Xanh
(4, 7, 3, '17:15:00'), -- Suối Tiên
(4, 6, 4, '17:30:00'); -- KTX Khu B

-- === TUYẾN 3 (Ngã 4 Thủ Đức - Hàng Xanh) ===
INSERT INTO `RouteStops` (`route_id`, `stop_id`, `thu_tu`, `gio_don_du_kien`) VALUES
(5, 8, 1, '06:00:00'), -- Ngã 4 Thủ Đức
(5, 7, 2, '06:15:00'), -- Suối Tiên
(5, 9, 3, '06:45:00'); -- Hàng Xanh

INSERT INTO `RouteStops` (`route_id`, `stop_id`, `thu_tu`, `gio_don_du_kien`) VALUES
(6, 9, 1, '17:00:00'), -- Hàng Xanh
(6, 7, 2, '17:30:00'), -- Suối Tiên
(6, 8, 3, '17:45:00'); -- Ngã 4 Thủ Đức

-- --------------------------------------------------------

-- 5. THÊM HỌC SINH (20 HS).
INSERT INTO `Students` (`ho_ten`, `lop`, `ngay_sinh`, `gioi_tinh`, `gvcn`, `parent_id`, `default_route_stop_id`) VALUES
('Nguyễn Văn Con A', '1A', '2018-01-01', 'Nam', 'Cô Lan', 7, 1),
('Trần Thị Con B', '2B', '2017-05-05', 'Nữ', 'Thầy Hùng', 8, 2),
('Lê Văn Con C', '3C', '2016-02-02', 'Nam', 'Cô Mai', 9, 3),
('Phạm Thị Con D', '1A', '2018-03-03', 'Nữ', 'Cô Lan', 10, 1),
('Hoàng Văn Con E', '4D', '2015-09-09', 'Nam', 'Thầy Tuấn', 11, 4),
('Vũ Thị Con F', '5E', '2014-12-12', 'Nữ', 'Cô Cúc', 12, 5),
('Đặng Văn Con G', '2B', '2017-07-07', 'Nam', 'Thầy Hùng', 13, 6),
('Bùi Thị Con H', '3C', '2016-08-08', 'Nữ', 'Cô Mai', 14, 2),
('Đỗ Văn Con I', '4D', '2015-11-11', 'Nam', 'Thầy Tuấn', 15, 3),
('Hồ Thị Con K', '1A', '2018-06-06', 'Nữ', 'Cô Lan', 16, 4),
('Ngô Văn Con L', '5E', '2014-04-04', 'Nam', 'Cô Cúc', 17, 5),
('Dương Thị Con M', '2B', '2017-10-10', 'Nữ', 'Thầy Hùng', 18, 1),
('Lý Văn Con N', '3C', '2016-01-20', 'Nam', 'Cô Mai', 19, 6),
('Vương Thị Con O', '4D', '2015-02-28', 'Nữ', 'Thầy Tuấn', 20, 2),
('Nguyễn Văn Em A', '1A', '2018-01-01', 'Nam', 'Cô Lan', 7, 3),
('Trần Thị Em B', '2B', '2017-05-05', 'Nữ', 'Thầy Hùng', 8, 4),
('Lê Văn Em C', '3C', '2016-02-02', 'Nam', 'Cô Mai', 9, 5),
('Phạm Thị Em D', '1A', '2018-03-03', 'Nữ', 'Cô Lan', 10, 1),
('Hoàng Văn Em E', '4D', '2015-09-09', 'Nam', 'Thầy Tuấn', 11, 2),
('Vũ Thị Em F', '5E', '2014-12-12', 'Nữ', 'Cô Cúc', 12, 6);

-- --------------------------------------------------------

-- 6. THÊM LỊCH TRÌNH (Schedules) 
-- Lưu ý: 
-- - ID tài xế: 2,3,4,5,6 (ID 1 là admin)
-- - ID xe bus: 1-10
-- - Một tài xế/xe có thể chạy cả lượt đi và lượt về trong cùng ngày
-- - driver_id và bus_id có thể NULL (chưa phân công)

-- HÔM NAY (CURDATE())
INSERT INTO `Schedules` (`route_id`, `driver_id`, `bus_id`, `ngay_chay`, `trang_thai`) VALUES
-- Tuyến 1: Cùng tài xế (ID 2) và xe (ID 1) chạy cả đi và về
(1, 2, 1, CURDATE(), 'dangchay'),      -- Tuyến 1 Lượt đi: Q1->Q5
(2, 2, 1, CURDATE(), 'chuabatdau'),    -- Tuyến 1 Lượt về: Q5->Q1 (cùng tài xế, cùng xe)

-- Tuyến 2: Tài xế 3, xe 2 chạy cả 2 chiều
(3, 3, 2, CURDATE(), 'hoanthanh'),     -- Tuyến 2 Lượt đi: KTX->Q1
(4, 3, 2, CURDATE(), 'chuabatdau'),    -- Tuyến 2 Lượt về: Q1->KTX (cùng tài xế, cùng xe)

-- Tuyến 3: Chỉ tạo lịch chưa phân tài xế/xe (NULL)
(5, NULL, NULL, CURDATE(), 'chuabatdau'),  -- Tuyến 3 Lượt đi - Chưa phân công
(6, NULL, NULL, CURDATE(), 'chuabatdau');  -- Tuyến 3 Lượt về - Chưa phân công

-- NGÀY MAI (DATE_ADD)
INSERT INTO `Schedules` (`route_id`, `driver_id`, `bus_id`, `ngay_chay`, `trang_thai`) VALUES
(1, 4, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'chuabatdau'),  -- Tuyến 1 đi
(2, 4, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'chuabatdau'),  -- Tuyến 1 về
(3, 5, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'chuabatdau'),  -- Tuyến 2 đi
(5, NULL, NULL, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'chuabatdau'); -- Tuyến 3 chưa phân
-- --------------------------------------------------------

-- 7. ĐIỂM DANH & LỊCH SỬ
-- Điểm danh cho schedule_id = 1 (Tuyến 1 lượt đi, đang chạy)
INSERT INTO `ScheduleStudents` (`schedule_id`, `student_id`, `stop_id`, `trang_thai_don`) VALUES
(1, 1, 1, 'dihoc'),
(1, 2, 2, 'choxacnhan'),
(1, 3, 3, 'vangmat'),
(1, 15, 1, 'daxuong');

-- Lịch sử phân công
INSERT INTO `AssignmentHistory` (`tuyen`, `loai_tuyen`, `thao_tac`, `thoi_gian`, `ngay_chay_thuc_te`) VALUES
('Tuyến 1: Q1 - Q5', 'luot_di', 'Phân công tài xế Nguyễn Văn Bác và xe 59B-000.01', NOW(), CURDATE()),
('Tuyến 1: Q5 - Q1', 'luot_ve', 'Phân công tài xế Nguyễn Văn Bác và xe 59B-000.01', NOW(), CURDATE()),
('Tuyến 2: KTX - Q1', 'luot_di', 'Phân công tài xế Trần Văn Tài và xe 59B-000.02', NOW(), CURDATE()),
('Tuyến 2: Q1 - KTX', 'luot_ve', 'Phân công tài xế Trần Văn Tài và xe 59B-000.02', NOW(), CURDATE()),
('Tuyến 3: Thủ Đức - Hàng Xanh', 'luot_di', 'Tạo lịch trình mới - Chưa phân công', NOW(), CURDATE()),
('Tuyến 3: Hàng Xanh - Thủ Đức', 'luot_ve', 'Tạo lịch trình mới - Chưa phân công', NOW(), CURDATE()),
-- Lịch sử cho ngày mai
('Tuyến 1: Q1 - Q5', 'luot_di', 'Phân công tài xế Phạm Văn Lái và xe 59B-000.03', NOW(), DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
('Tuyến 1: Q5 - Q1', 'luot_ve', 'Phân công tài xế Phạm Văn Lái và xe 59B-000.03', NOW(), DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
('Tuyến 2: KTX - Q1', 'luot_di', 'Phân công tài xế Hoàng Văn Xe và xe 59B-000.04', NOW(), DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
('Tuyến 3: Thủ Đức - Hàng Xanh', 'luot_di', 'Tạo lịch trình - Chưa phân công', NOW(), DATE_ADD(CURDATE(), INTERVAL 1 DAY));
COMMIT;