-- ========================================================
-- DỮ LIỆU MẪU CHO SMART BUS TRACKING (DUAL DIRECTION)
-- ========================================================
-- Schema: Students có 2 cột: default_route_stop_id_di, default_route_stop_id_ve
-- Routes: 10 tuyến (5 tuyến × 2 chiều)
-- Mỗi học sinh được gán 2 lịch/ngày: lượt đi + lượt về
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. TẠO DỮ LIỆU USERS (1 Admin, 5 Tài xế, 40 Phụ huynh)
INSERT INTO
    `Users` (
        `driver_code`,
        `parent_code`,
        `username`,
        `email`,
        `password_hash`,
        `ho_ten`,
        `vai_tro`,
        `so_dien_thoai`,
        `bang_lai`,
        `trang_thai_taixe`
    )
VALUES
    -- Admin
    (
        NULL,
        NULL,
        'admin',
        'admin@school.com',
        '$2y$10$DummyHashFor123456',
        'Quản Trị Viên',
        'admin',
        '0909000001',
        NULL,
        NULL
    ),

-- 5 Tài xế (driver_code 1001-1005)
(
    1001,
    NULL,
    'taixe1',
    'tx1@bus.com',
    '$2y$10$DummyHashFor123456',
    'Nguyễn Văn A',
    'taixe',
    '0901000001',
    'Hạng D',
    'Tạm dừng'
),
(
    1002,
    NULL,
    'taixe2',
    'tx2@bus.com',
    '$2y$10$DummyHashFor123456',
    'Trần Văn B',
    'taixe',
    '0901000002',
    'Hạng E',
    'Tạm dừng'
),
(
    1003,
    NULL,
    'taixe3',
    'tx3@bus.com',
    '$2y$10$DummyHashFor123456',
    'Lê Văn C',
    'taixe',
    '0901000003',
    'Hạng D',
    'Tạm dừng'
),
(
    1004,
    NULL,
    'taixe4',
    'tx4@bus.com',
    '$2y$10$DummyHashFor123456',
    'Phạm Văn D',
    'taixe',
    '0901000004',
    'Hạng D',
    'Tạm dừng'
),
(
    1005,
    NULL,
    'taixe5',
    'tx5@bus.com',
    '$2y$10$DummyHashFor123456',
    'Hoàng Văn E',
    'taixe',
    '0901000005',
    'Hạng E',
    'Tạm dừng'
),

-- 40 Phụ huynh (parent_code 2001-2040)
(
    NULL,
    2001,
    'ph1',
    'ph1@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 1',
    'phuhuynh',
    '0912000001',
    NULL,
    NULL
),
(
    NULL,
    2002,
    'ph2',
    'ph2@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 2',
    'phuhuynh',
    '0912000002',
    NULL,
    NULL
),
(
    NULL,
    2003,
    'ph3',
    'ph3@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 3',
    'phuhuynh',
    '0912000003',
    NULL,
    NULL
),
(
    NULL,
    2004,
    'ph4',
    'ph4@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 4',
    'phuhuynh',
    '0912000004',
    NULL,
    NULL
),
(
    NULL,
    2005,
    'ph5',
    'ph5@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 5',
    'phuhuynh',
    '0912000005',
    NULL,
    NULL
),
(
    NULL,
    2006,
    'ph6',
    'ph6@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 6',
    'phuhuynh',
    '0912000006',
    NULL,
    NULL
),
(
    NULL,
    2007,
    'ph7',
    'ph7@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 7',
    'phuhuynh',
    '0912000007',
    NULL,
    NULL
),
(
    NULL,
    2008,
    'ph8',
    'ph8@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 8',
    'phuhuynh',
    '0912000008',
    NULL,
    NULL
),
(
    NULL,
    2009,
    'ph9',
    'ph9@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 9',
    'phuhuynh',
    '0912000009',
    NULL,
    NULL
),
(
    NULL,
    2010,
    'ph10',
    'ph10@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 10',
    'phuhuynh',
    '0912000010',
    NULL,
    NULL
),
(
    NULL,
    2011,
    'ph11',
    'ph11@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 11',
    'phuhuynh',
    '0912000011',
    NULL,
    NULL
),
(
    NULL,
    2012,
    'ph12',
    'ph12@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 12',
    'phuhuynh',
    '0912000012',
    NULL,
    NULL
),
(
    NULL,
    2013,
    'ph13',
    'ph13@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 13',
    'phuhuynh',
    '0912000013',
    NULL,
    NULL
),
(
    NULL,
    2014,
    'ph14',
    'ph14@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 14',
    'phuhuynh',
    '0912000014',
    NULL,
    NULL
),
(
    NULL,
    2015,
    'ph15',
    'ph15@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 15',
    'phuhuynh',
    '0912000015',
    NULL,
    NULL
),
(
    NULL,
    2016,
    'ph16',
    'ph16@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 16',
    'phuhuynh',
    '0912000016',
    NULL,
    NULL
),
(
    NULL,
    2017,
    'ph17',
    'ph17@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 17',
    'phuhuynh',
    '0912000017',
    NULL,
    NULL
),
(
    NULL,
    2018,
    'ph18',
    'ph18@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 18',
    'phuhuynh',
    '0912000018',
    NULL,
    NULL
),
(
    NULL,
    2019,
    'ph19',
    'ph19@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 19',
    'phuhuynh',
    '0912000019',
    NULL,
    NULL
),
(
    NULL,
    2020,
    'ph20',
    'ph20@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 20',
    'phuhuynh',
    '0912000020',
    NULL,
    NULL
),
(
    NULL,
    2021,
    'ph21',
    'ph21@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 21',
    'phuhuynh',
    '0912000021',
    NULL,
    NULL
),
(
    NULL,
    2022,
    'ph22',
    'ph22@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 22',
    'phuhuynh',
    '0912000022',
    NULL,
    NULL
),
(
    NULL,
    2023,
    'ph23',
    'ph23@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 23',
    'phuhuynh',
    '0912000023',
    NULL,
    NULL
),
(
    NULL,
    2024,
    'ph24',
    'ph24@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 24',
    'phuhuynh',
    '0912000024',
    NULL,
    NULL
),
(
    NULL,
    2025,
    'ph25',
    'ph25@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 25',
    'phuhuynh',
    '0912000025',
    NULL,
    NULL
),
(
    NULL,
    2026,
    'ph26',
    'ph26@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 26',
    'phuhuynh',
    '0912000026',
    NULL,
    NULL
),
(
    NULL,
    2027,
    'ph27',
    'ph27@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 27',
    'phuhuynh',
    '0912000027',
    NULL,
    NULL
),
(
    NULL,
    2028,
    'ph28',
    'ph28@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 28',
    'phuhuynh',
    '0912000028',
    NULL,
    NULL
),
(
    NULL,
    2029,
    'ph29',
    'ph29@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 29',
    'phuhuynh',
    '0912000029',
    NULL,
    NULL
),
(
    NULL,
    2030,
    'ph30',
    'ph30@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 30',
    'phuhuynh',
    '0912000030',
    NULL,
    NULL
),
(
    NULL,
    2031,
    'ph31',
    'ph31@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 31',
    'phuhuynh',
    '0912000031',
    NULL,
    NULL
),
(
    NULL,
    2032,
    'ph32',
    'ph32@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 32',
    'phuhuynh',
    '0912000032',
    NULL,
    NULL
),
(
    NULL,
    2033,
    'ph33',
    'ph33@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 33',
    'phuhuynh',
    '0912000033',
    NULL,
    NULL
),
(
    NULL,
    2034,
    'ph34',
    'ph34@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 34',
    'phuhuynh',
    '0912000034',
    NULL,
    NULL
),
(
    NULL,
    2035,
    'ph35',
    'ph35@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 35',
    'phuhuynh',
    '0912000035',
    NULL,
    NULL
),
(
    NULL,
    2036,
    'ph36',
    'ph36@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 36',
    'phuhuynh',
    '0912000036',
    NULL,
    NULL
),
(
    NULL,
    2037,
    'ph37',
    'ph37@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 37',
    'phuhuynh',
    '0912000037',
    NULL,
    NULL
),
(
    NULL,
    2038,
    'ph38',
    'ph38@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 38',
    'phuhuynh',
    '0912000038',
    NULL,
    NULL
),
(
    NULL,
    2039,
    'ph39',
    'ph39@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 39',
    'phuhuynh',
    '0912000039',
    NULL,
    NULL
),
(
    NULL,
    2040,
    'ph40',
    'ph40@gmail.com',
    '$2y$10$DummyHashFor123456',
    'Phụ Huynh 40',
    'phuhuynh',
    '0912000040',
    NULL,
    NULL
);

-- --------------------------------------------------------
-- 2. TẠO DỮ LIỆU XE BUÝT (5 Xe)
-- --------------------------------------------------------
INSERT INTO
    `Buses` (
        `bien_so_xe`,
        `hang_xe`,
        `nam_san_xuat`,
        `so_ghe`,
        `trang_thai`
    )
VALUES (
        '51B-123.45',
        'Hyundai County',
        2019,
        29,
        'Ngừng'
    ),
    (
        '51B-234.56',
        'Thaco Garden',
        2020,
        29,
        'Ngừng'
    ),
    (
        '51B-345.67',
        'Samco Felix',
        2018,
        34,
        'Ngừng'
    ),
    (
        '51B-456.78',
        'Ford Transit',
        2021,
        16,
        'Ngừng'
    ),
    (
        '51B-567.89',
        'Hyundai Solati',
        2022,
        16,
        'Ngừng'
    );

-- --------------------------------------------------------
-- 3. TẠO DỮ LIỆU ĐIỂM DỪNG (Stops)
-- Điểm 1 là Trường học (trung tâm), các điểm khác là điểm đón
-- --------------------------------------------------------
INSERT INTO
    `Stops` (
        `ten_diem`,
        `dia_chi`,
        `latitude`,
        `longitude`
    )
VALUES (
        'Trường Quốc Tế ABC',
        '123 Nguyễn Văn Linh, Q7, TP.HCM',
        10.729370,
        106.696140
    ), -- ID 1 (Destination)
    (
        'Chung Cư Sunrise City',
        '27 Nguyễn Hữu Thọ, Q7',
        10.738000,
        106.699000
    ), -- ID 2
    (
        'Lotte Mart Quận 7',
        '469 Nguyễn Hữu Thọ, Q7',
        10.735000,
        106.700000
    ), -- ID 3
    (
        'Crescent Mall',
        '101 Tôn Dật Tiên, Q7',
        10.728000,
        106.718000
    ), -- ID 4
    (
        'Chung Cư Hoàng Anh Gia Lai',
        'Lê Văn Lương, Nhà Bè',
        10.700000,
        106.690000
    ), -- ID 5
    (
        'Khu Đô Thị Phú Mỹ Hưng',
        'Nguyễn Đức Cảnh, Q7',
        10.720000,
        106.710000
    ), -- ID 6
    (
        'Vinhomes Central Park',
        '208 Nguyễn Hữu Cảnh, Bình Thạnh',
        10.795000,
        106.720000
    ), -- ID 7
    (
        'Saigon Pearl',
        '92 Nguyễn Hữu Cảnh, Bình Thạnh',
        10.790000,
        106.715000
    ), -- ID 8
    (
        'Chợ Bến Thành',
        'Lê Lợi, Quận 1',
        10.772000,
        106.698000
    ), -- ID 9
    (
        'Công viên Tao Đàn',
        'Nguyễn Thị Minh Khai, Quận 1',
        10.775000,
        106.690000
    ), -- ID 10
    (
        'Chung cư Novaland',
        'Bến Vân Đồn, Quận 4',
        10.760000,
        106.700000
    ), -- ID 11
    (
        'Chung cư Gold View',
        '346 Bến Vân Đồn, Quận 4',
        10.758000,
        106.695000
    ), -- ID 12
    (
        'Đại Học Tôn Đức Thắng',
        '19 Nguyễn Hữu Thọ, Q7',
        10.732000,
        106.697000
    ), -- ID 13
    (
        'Đại Học RMIT',
        '702 Nguyễn Văn Linh, Q7',
        10.725000,
        106.690000
    ), -- ID 14
    (
        'Khu Dân Cư Trung Sơn',
        'Đường 9A, Bình Chánh',
        10.740000,
        106.685000
    ), -- ID 15
    (
        'AEON Mall Bình Tân',
        'Số 1 Đường 17A, Bình Tân',
        10.750000,
        106.600000
    );
-- ID 16

-- 4. TẠO 10 TUYẾN ĐƯỜNG (5 Tuyến × 2 Chiều: lượt_di + lượt_về)
INSERT INTO
    `Routes` (
        `ten_tuyen`,
        `mo_ta`,
        `khoang_cach`,
        `thoi_gian_du_kien`,
        `loai_tuyen`
    )
VALUES
    -- Tuyến 1: Nhà Bè - Trường (2 chiều)
    (
        'Tuyến 1 Lượt Đi',
        'Nhà Bè → Trường ABC',
        10.5,
        45,
        'luot_di'
    ),
    (
        'Tuyến 1 Lượt Về',
        'Trường ABC → Nhà Bè',
        10.5,
        45,
        'luot_ve'
    ),
    -- Tuyến 2: Phú Mỹ Hưng - Trường (2 chiều)
    (
        'Tuyến 2 Lượt Đi',
        'Phú Mỹ Hưng → Trường ABC',
        5.0,
        30,
        'luot_di'
    ),
    (
        'Tuyến 2 Lượt Về',
        'Trường ABC → Phú Mỹ Hưng',
        5.0,
        30,
        'luot_ve'
    ),
    -- Tuyến 3: Bình Thạnh - Trường (2 chiều)
    (
        'Tuyến 3 Lượt Đi',
        'Bình Thạnh → Trường ABC',
        12.0,
        60,
        'luot_di'
    ),
    (
        'Tuyến 3 Lượt Về',
        'Trường ABC → Bình Thạnh',
        12.0,
        60,
        'luot_ve'
    ),
    -- Tuyến 4: Quận 4 - Trường (2 chiều)
    (
        'Tuyến 4 Lượt Đi',
        'Quận 4 → Trường ABC',
        8.5,
        50,
        'luot_di'
    ),
    (
        'Tuyến 4 Lượt Về',
        'Trường ABC → Quận 4',
        8.5,
        50,
        'luot_ve'
    ),
    -- Tuyến 5: Trung Sơn - Trường (2 chiều)
    (
        'Tuyến 5 Lượt Đi',
        'Trung Sơn → Trường ABC',
        6.0,
        35,
        'luot_di'
    ),
    (
        'Tuyến 5 Lượt Về',
        'Trường ABC → Trung Sơn',
        6.0,
        35,
        'luot_ve'
    );

-- 5. CẤU HÌNH ĐIỂM DỪNG CHO 10 TUYẾN (RouteStops)
-- Route 1 (Lượt Đi): Điểm 5 → 14 → 2 → 1
INSERT INTO
    `RouteStops` (
        `route_id`,
        `stop_id`,
        `thu_tu`,
        `gio_don_du_kien`
    )
VALUES (1, 5, 1, '06:00:00'),
    (1, 14, 2, '06:15:00'),
    (1, 2, 3, '06:30:00'),
    (1, 1, 4, '06:45:00');
-- Route 2 (Lượt Về): Điểm 1 → 2 → 14 → 5
INSERT INTO
    `RouteStops` (
        `route_id`,
        `stop_id`,
        `thu_tu`,
        `gio_don_du_kien`
    )
VALUES (2, 1, 1, '15:30:00'),
    (2, 2, 2, '15:45:00'),
    (2, 14, 3, '16:00:00'),
    (2, 5, 4, '16:15:00');
-- Route 3 (Lượt Đi): Điểm 4 → 6 → 3
INSERT INTO
    `RouteStops` (
        `route_id`,
        `stop_id`,
        `thu_tu`,
        `gio_don_du_kien`
    )
VALUES (3, 4, 1, '06:15:00'),
    (3, 6, 2, '06:25:00'),
    (3, 3, 3, '06:35:00'),
    (3, 1, 4, '06:50:00');
-- Route 4 (Lượt Về): Điểm 1 → 3 → 6 → 4
INSERT INTO
    `RouteStops` (
        `route_id`,
        `stop_id`,
        `thu_tu`,
        `gio_don_du_kien`
    )
VALUES (4, 1, 1, '15:45:00'),
    (4, 3, 2, '16:00:00'),
    (4, 6, 3, '16:10:00'),
    (4, 4, 4, '16:25:00');
-- Route 5 (Lượt Đi): Điểm 7 → 8 → 10
INSERT INTO
    `RouteStops` (
        `route_id`,
        `stop_id`,
        `thu_tu`,
        `gio_don_du_kien`
    )
VALUES (5, 7, 1, '05:45:00'),
    (5, 8, 2, '06:00:00'),
    (5, 10, 3, '06:20:00'),
    (5, 1, 4, '06:55:00');
-- Route 6 (Lượt Về): Điểm 1 → 10 → 8 → 7
INSERT INTO
    `RouteStops` (
        `route_id`,
        `stop_id`,
        `thu_tu`,
        `gio_don_du_kien`
    )
VALUES (6, 1, 1, '15:30:00'),
    (6, 10, 2, '16:05:00'),
    (6, 8, 3, '16:25:00'),
    (6, 7, 4, '16:40:00');
-- Route 7 (Lượt Đi): Điểm 9 → 11 → 12
INSERT INTO
    `RouteStops` (
        `route_id`,
        `stop_id`,
        `thu_tu`,
        `gio_don_du_kien`
    )
VALUES (7, 9, 1, '06:00:00'),
    (7, 11, 2, '06:15:00'),
    (7, 12, 3, '06:25:00'),
    (7, 1, 4, '06:50:00');
-- Route 8 (Lượt Về): Điểm 1 → 12 → 11 → 9
INSERT INTO
    `RouteStops` (
        `route_id`,
        `stop_id`,
        `thu_tu`,
        `gio_don_du_kien`
    )
VALUES (8, 1, 1, '15:30:00'),
    (8, 12, 2, '15:55:00'),
    (8, 11, 3, '16:05:00'),
    (8, 9, 4, '16:20:00');
-- Route 9 (Lượt Đi): Điểm 16 → 15 → 13
INSERT INTO
    `RouteStops` (
        `route_id`,
        `stop_id`,
        `thu_tu`,
        `gio_don_du_kien`
    )
VALUES (9, 16, 1, '06:00:00'),
    (9, 15, 2, '06:20:00'),
    (9, 13, 3, '06:35:00'),
    (9, 1, 4, '06:55:00');
-- Route 10 (Lượt Về): Điểm 1 → 13 → 15 → 16
INSERT INTO
    `RouteStops` (
        `route_id`,
        `stop_id`,
        `thu_tu`,
        `gio_don_du_kien`
    )
VALUES (10, 1, 1, '15:40:00'),
    (10, 13, 2, '16:00:00'),
    (10, 15, 3, '16:15:00'),
    (10, 16, 4, '16:35:00');

-- 6. TẠO HỌC SINH (35 Students) - MỖI HỌC SINH CÓ 2 ROUTESTOP (DI + VỀ)
-- Phân chia: 7 học sinh/tuyến × 5 tuyến = 35 học sinh
-- Mỗi học sinh gán vào default_route_stop_id_di (lượt đi) + default_route_stop_id_ve (lượt về)
INSERT INTO
    `Students` (
        `ho_ten`,
        `lop`,
        `ngay_sinh`,
        `gioi_tinh`,
        `gvcn`,
        `parent_id`,
        `default_route_stop_id_di`,
        `default_route_stop_id_ve`
    )
VALUES
    -- Tuyến 1: 7 học sinh
    (
        'Nguyễn Văn Tèo',
        '1A',
        '2016-01-01',
        'Nam',
        'Cô Hạnh',
        7,
        1,
        14
    ),
    (
        'Lê Thị Mận',
        '2B',
        '2015-02-02',
        'Nữ',
        'Cô Lan',
        8,
        1,
        14
    ),
    (
        'Trần Văn Tí',
        '3C',
        '2014-03-03',
        'Nam',
        'Thầy Hùng',
        9,
        2,
        15
    ),
    (
        'Phạm Thị Na',
        '1A',
        '2016-04-04',
        'Nữ',
        'Cô Hạnh',
        10,
        2,
        15
    ),
    (
        'Hoàng Văn Bưởi',
        '5D',
        '2012-05-05',
        'Nam',
        'Cô Thảo',
        11,
        3,
        16
    ),
    (
        'Đỗ Thị Cam',
        '4E',
        '2013-06-06',
        'Nữ',
        'Thầy Minh',
        12,
        3,
        16
    ),
    (
        'Ngô Văn Quýt',
        '2B',
        '2015-07-07',
        'Nam',
        'Cô Lan',
        13,
        3,
        16
    ),
    -- Tuyến 2: 7 học sinh
    (
        'Vũ Thị Mít',
        '3C',
        '2014-08-08',
        'Nữ',
        'Thầy Hùng',
        14,
        5,
        18
    ),
    (
        'Đặng Văn Dừa',
        '5D',
        '2012-09-09',
        'Nam',
        'Cô Thảo',
        15,
        5,
        18
    ),
    (
        'Bùi Thị Thơm',
        '1A',
        '2016-10-10',
        'Nữ',
        'Cô Hạnh',
        16,
        6,
        19
    ),
    (
        'Dương Văn Ổi',
        '4E',
        '2013-11-11',
        'Nam',
        'Thầy Minh',
        17,
        6,
        19
    ),
    (
        'Lý Thị Xoài',
        '2B',
        '2015-12-12',
        'Nữ',
        'Cô Lan',
        18,
        7,
        20
    ),
    (
        'Hồ Văn Cóc',
        '3C',
        '2014-01-13',
        'Nam',
        'Thầy Hùng',
        19,
        7,
        20
    ),
    (
        'Mai Thị Lê',
        '5D',
        '2012-02-14',
        'Nữ',
        'Cô Thảo',
        20,
        5,
        18
    ),
    -- Tuyến 3: 7 học sinh
    (
        'Trương Văn Táo',
        '4E',
        '2013-03-15',
        'Nam',
        'Thầy Minh',
        21,
        9,
        22
    ),
    (
        'Đinh Thị Lựu',
        '1A',
        '2016-04-16',
        'Nữ',
        'Cô Hạnh',
        22,
        9,
        22
    ),
    (
        'Đoàn Văn Nho',
        '2B',
        '2015-05-17',
        'Nam',
        'Cô Lan',
        23,
        10,
        23
    ),
    (
        'Lâm Thị Me',
        '3C',
        '2014-06-18',
        'Nữ',
        'Thầy Hùng',
        24,
        10,
        23
    ),
    (
        'Hà Văn Sấu',
        '5D',
        '2012-07-19',
        'Nam',
        'Cô Thảo',
        25,
        11,
        24
    ),
    (
        'Phan Thị Dâu',
        '4E',
        '2013-08-20',
        'Nữ',
        'Thầy Minh',
        26,
        11,
        24
    ),
    (
        'Cao Văn Sung',
        '1A',
        '2016-09-21',
        'Nam',
        'Cô Hạnh',
        27,
        9,
        22
    ),
    -- Tuyến 4: 7 học sinh
    (
        'Nguyễn Thị Đào',
        '2B',
        '2015-10-22',
        'Nữ',
        'Cô Lan',
        28,
        9,
        3
    ),
    (
        'Trần Văn Hồng',
        '3C',
        '2014-11-23',
        'Nam',
        'Thầy Hùng',
        29,
        9,
        3
    ),
    (
        'Lê Thị Hạnh',
        '5D',
        '2012-12-24',
        'Nữ',
        'Cô Thảo',
        30,
        10,
        6
    ),
    (
        'Phạm Văn Phúc',
        '4E',
        '2013-01-25',
        'Nam',
        'Thầy Minh',
        31,
        10,
        6
    ),
    (
        'Hoàng Thị An',
        '1A',
        '2016-02-26',
        'Nữ',
        'Cô Hạnh',
        32,
        11,
        4
    ),
    (
        'Vũ Văn Bình',
        '2B',
        '2015-03-27',
        'Nam',
        'Cô Lan',
        33,
        11,
        4
    ),
    (
        'Đặng Thị Yên',
        '3C',
        '2014-04-28',
        'Nữ',
        'Thầy Hùng',
        34,
        9,
        3
    ),
    -- Tuyến 5: 7 học sinh
    (
        'Bùi Văn Vui',
        '5D',
        '2012-05-29',
        'Nam',
        'Cô Thảo',
        35,
        12,
        7
    ),
    (
        'Dương Thị Mừng',
        '4E',
        '2013-06-30',
        'Nữ',
        'Thầy Minh',
        36,
        12,
        7
    ),
    (
        'Lý Văn Sướng',
        '1A',
        '2016-07-01',
        'Nam',
        'Cô Hạnh',
        37,
        13,
        10
    ),
    (
        'Hồ Thị Ca',
        '2B',
        '2015-08-02',
        'Nữ',
        'Cô Lan',
        38,
        13,
        10
    ),
    (
        'Mai Văn Hát',
        '3C',
        '2014-09-03',
        'Nam',
        'Thầy Hùng',
        39,
        16,
        8
    ),
    (
        'Trương Thị Múa',
        '5D',
        '2012-10-04',
        'Nữ',
        'Cô Thảo',
        40,
        16,
        8
    ),
    (
        'Đinh Văn Nhảy',
        '4E',
        '2013-11-05',
        'Nam',
        'Thầy Minh',
        41,
        12,
        7
    );

-- 7. TẠO 10 LỊCH TRÌNH (10 Schedules - 5 Tuyến × 2 Chiều)
-- Mỗi tài xế chạy cả 2 chiều (lượt đi + lượt về) cùng 1 xe trong 1 ngày
INSERT INTO
    `Schedules` (
        `route_id`,
        `driver_id`,
        `bus_id`,
        `ngay_chay`,
        `trang_thai`,
        `gio_bat_dau`
    )
VALUES
    -- Tuyến 1: Driver 2, Bus 1
    (
        1,
        2,
        1,
        CURDATE(),
        'chuabatdau',
        '06:00:00'
    ), -- Lượt đi
    (
        2,
        2,
        1,
        CURDATE(),
        'chuabatdau',
        '15:30:00'
    ), -- Lượt về (cùng tài xế, cùng xe)
    -- Tuyến 2: Driver 3, Bus 2
    (
        3,
        3,
        2,
        CURDATE(),
        'chuabatdau',
        '06:15:00'
    ), -- Lượt đi
    (
        4,
        3,
        2,
        CURDATE(),
        'chuabatdau',
        '15:45:00'
    ), -- Lượt về
    -- Tuyến 3: Driver 4, Bus 3
    (
        5,
        4,
        3,
        CURDATE(),
        'chuabatdau',
        '05:45:00'
    ), -- Lượt đi
    (
        6,
        4,
        3,
        CURDATE(),
        'chuabatdau',
        '15:30:00'
    ), -- Lượt về
    -- Tuyến 4: Driver 5, Bus 4
    (
        7,
        5,
        4,
        CURDATE(),
        'chuabatdau',
        '06:00:00'
    ), -- Lượt đi
    (
        8,
        5,
        4,
        CURDATE(),
        'chuabatdau',
        '15:30:00'
    ), -- Lượt về
    -- Tuyến 5: Driver 6, Bus 5 (Nếu không có user ID 6, để NULL driver)
    (
        9,
        NULL,
        5,
        CURDATE(),
        'chuabatdau',
        '06:00:00'
    ), -- Lượt đi
    (
        10,
        NULL,
        5,
        CURDATE(),
        'chuabatdau',
        '15:40:00'
    );
-- Lượt về

-- 8. PHÂN CÔNG HỌC SINH VÀO LỊCH TRÌNH (ScheduleStudents)
-- Mỗi học sinh xuất hiện CÙNG LÚC trên 2 schedules (lượt đi + lượt về)
-- Schedule 1 (Tuyến 1 Đi) - 7 học sinh
INSERT INTO
    `ScheduleStudents` (
        `schedule_id`,
        `student_id`,
        `stop_id`,
        `trang_thai_don`
    )
VALUES (1, 1, 1, 'choxacnhan'),
    (1, 2, 1, 'choxacnhan'),
    (1, 3, 2, 'choxacnhan'),
    (1, 4, 2, 'choxacnhan'),
    (1, 5, 3, 'choxacnhan'),
    (1, 6, 3, 'choxacnhan'),
    (1, 7, 3, 'choxacnhan');
-- Schedule 2 (Tuyến 1 Về) - Cùng 7 học sinh
INSERT INTO
    `ScheduleStudents` (
        `schedule_id`,
        `student_id`,
        `stop_id`,
        `trang_thai_don`
    )
VALUES (2, 1, 2, 'choxacnhan'),
    (2, 2, 2, 'choxacnhan'),
    (2, 3, 5, 'choxacnhan'),
    (2, 4, 5, 'choxacnhan'),
    (2, 5, 1, 'choxacnhan'),
    (2, 6, 1, 'choxacnhan'),
    (2, 7, 1, 'choxacnhan');
-- Schedule 3 (Tuyến 2 Đi) - 7 học sinh
INSERT INTO
    `ScheduleStudents` (
        `schedule_id`,
        `student_id`,
        `stop_id`,
        `trang_thai_don`
    )
VALUES (3, 8, 5, 'choxacnhan'),
    (3, 9, 5, 'choxacnhan'),
    (3, 10, 6, 'choxacnhan'),
    (3, 11, 6, 'choxacnhan'),
    (3, 12, 7, 'choxacnhan'),
    (3, 13, 7, 'choxacnhan'),
    (3, 14, 5, 'choxacnhan');
-- Schedule 4 (Tuyến 2 Về) - Cùng 7 học sinh
INSERT INTO
    `ScheduleStudents` (
        `schedule_id`,
        `student_id`,
        `stop_id`,
        `trang_thai_don`
    )
VALUES (4, 8, 4, 'choxacnhan'),
    (4, 9, 4, 'choxacnhan'),
    (4, 10, 3, 'choxacnhan'),
    (4, 11, 3, 'choxacnhan'),
    (4, 12, 6, 'choxacnhan'),
    (4, 13, 6, 'choxacnhan'),
    (4, 14, 4, 'choxacnhan');
-- Schedule 5 (Tuyến 3 Đi) - 7 học sinh
INSERT INTO
    `ScheduleStudents` (
        `schedule_id`,
        `student_id`,
        `stop_id`,
        `trang_thai_don`
    )
VALUES (5, 15, 9, 'choxacnhan'),
    (5, 16, 9, 'choxacnhan'),
    (5, 17, 10, 'choxacnhan'),
    (5, 18, 10, 'choxacnhan'),
    (5, 19, 11, 'choxacnhan'),
    (5, 20, 11, 'choxacnhan'),
    (5, 21, 9, 'choxacnhan');
-- Schedule 6 (Tuyến 3 Về) - Cùng 7 học sinh
INSERT INTO
    `ScheduleStudents` (
        `schedule_id`,
        `student_id`,
        `stop_id`,
        `trang_thai_don`
    )
VALUES (6, 15, 3, 'choxacnhan'),
    (6, 16, 3, 'choxacnhan'),
    (6, 17, 6, 'choxacnhan'),
    (6, 18, 6, 'choxacnhan'),
    (6, 19, 4, 'choxacnhan'),
    (6, 20, 4, 'choxacnhan'),
    (6, 21, 3, 'choxacnhan');
-- Schedule 7 (Tuyến 4 Đi) - 7 học sinh
INSERT INTO
    `ScheduleStudents` (
        `schedule_id`,
        `student_id`,
        `stop_id`,
        `trang_thai_don`
    )
VALUES (7, 22, 9, 'choxacnhan'),
    (7, 23, 9, 'choxacnhan'),
    (7, 24, 10, 'choxacnhan'),
    (7, 25, 10, 'choxacnhan'),
    (7, 26, 11, 'choxacnhan'),
    (7, 27, 11, 'choxacnhan'),
    (7, 28, 9, 'choxacnhan');
-- Schedule 8 (Tuyến 4 Về) - Cùng 7 học sinh
INSERT INTO
    `ScheduleStudents` (
        `schedule_id`,
        `student_id`,
        `stop_id`,
        `trang_thai_don`
    )
VALUES (8, 22, 3, 'choxacnhan'),
    (8, 23, 3, 'choxacnhan'),
    (8, 24, 6, 'choxacnhan'),
    (8, 25, 6, 'choxacnhan'),
    (8, 26, 4, 'choxacnhan'),
    (8, 27, 4, 'choxacnhan'),
    (8, 28, 3, 'choxacnhan');
-- Schedule 9 (Tuyến 5 Đi) - 7 học sinh
INSERT INTO
    `ScheduleStudents` (
        `schedule_id`,
        `student_id`,
        `stop_id`,
        `trang_thai_don`
    )
VALUES (9, 29, 12, 'choxacnhan'),
    (9, 30, 12, 'choxacnhan'),
    (9, 31, 13, 'choxacnhan'),
    (9, 32, 13, 'choxacnhan'),
    (9, 33, 16, 'choxacnhan'),
    (9, 34, 16, 'choxacnhan'),
    (9, 35, 12, 'choxacnhan');
-- Schedule 10 (Tuyến 5 Về) - Cùng 7 học sinh
INSERT INTO
    `ScheduleStudents` (
        `schedule_id`,
        `student_id`,
        `stop_id`,
        `trang_thai_don`
    )
VALUES (10, 29, 7, 'choxacnhan'),
    (10, 30, 7, 'choxacnhan'),
    (10, 31, 10, 'choxacnhan'),
    (10, 32, 10, 'choxacnhan'),
    (10, 33, 8, 'choxacnhan'),
    (10, 34, 8, 'choxacnhan'),
    (10, 35, 7, 'choxacnhan');

-- 9. BẬT LẠI KIỂM TRA KHÓA NGOẠI
SET FOREIGN_KEY_CHECKS = 1;

COMMIT;