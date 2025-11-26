-- phpMyAdmin SQL Dump
-- Phiên bản cuối cùng - Đã cập nhật theo thiết kế Figma
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: `smart_bus_tracking_optimized`
--
CREATE DATABASE IF NOT EXISTS `smart_bus_tracking_optimized` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smart_bus_tracking_optimized`;

-- --------------------------------------------------------

--
-- Bảng 1: `Users` (Gộp NguoiDung, TaiXe, PhuHuynh)
--
CREATE TABLE `Users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `driver_code` INT DEFAULT NULL, -- them cái này dùng cho tài xế
  `parent_code` INT DEFAULT NULL, -- thêm cái này dùng cho phụ huynh
  `username` VARCHAR(50) NOT NULL UNIQUE, -- Đã thêm cột này
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `ho_ten` VARCHAR(150) NOT NULL,
  `ngay_sinh` DATE DEFAULT NULL,
  `gioi_tinh` ENUM('Nam', 'Nữ') DEFAULT NULL,
  `so_dien_thoai` VARCHAR(20) UNIQUE,
  `vai_tro` ENUM('admin', 'taixe', 'phuhuynh') NOT NULL,
  `dia_chi` VARCHAR(255) DEFAULT NULL,
  `bang_lai` VARCHAR(50) DEFAULT NULL, -- Chỉ dùng cho tài xế
  `trang_thai_taixe` ENUM('Đang hoạt động', 'Nghỉ', 'Tạm dừng') DEFAULT NULL, -- Chỉ dùng cho tài xế
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Bảng 2: `Buses` (Xe Buýt)
--
CREATE TABLE `Buses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bien_so_xe` VARCHAR(20) NOT NULL UNIQUE,
  
  `hang_xe` VARCHAR(50) DEFAULT NULL,
  `nam_san_xuat` INT DEFAULT NULL,
  `so_ghe` INT DEFAULT 30,
  `so_km_da_chay` DECIMAL(10, 2) DEFAULT 0,
  `lich_bao_duong` DATE DEFAULT NULL,
  
  `trang_thai` ENUM('Đang hoạt động', 'Bảo trì', 'Ngừng') DEFAULT 'Ngừng'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------


--
-- Bảng 4: `Stops` (Điểm Dừng)
--
CREATE TABLE `Stops` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ten_diem` VARCHAR(200) NOT NULL,
  `dia_chi` VARCHAR(255) DEFAULT NULL,
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 5: `Routes` (Tuyến Đường)

CREATE TABLE `Routes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ten_tuyen` VARCHAR(200) NOT NULL,
  `mo_ta` TEXT DEFAULT NULL,
  `khoang_cach` DECIMAL(5,2) DEFAULT 0 COMMENT 'Đơn vị km',
  `khung_gio` VARCHAR(50),
  `thoi_gian_du_kien` INT DEFAULT 0 COMMENT 'Đơn vị phút',
  `loai_tuyen` ENUM('luot_di', 'luot_ve') NOT NULL DEFAULT 'luot_di'
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 6: `RouteStops` (Các Điểm Dừng Của Tuyến)
--
CREATE TABLE `RouteStops` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `route_id` INT NOT NULL,
  `stop_id` INT NOT NULL,
  `thu_tu` INT NOT NULL,
  `gio_don_du_kien` TIME DEFAULT NULL,
  
  FOREIGN KEY (`route_id`) REFERENCES `Routes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stop_id`) REFERENCES `Stops`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `route_stop_order` (`route_id`, `thu_tu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 7: `Students` (Học Sinh)
-- *** CẬP NHẬT: Thêm ngay_sinh, gioi_tinh, gvcn từ Figma ***
--
CREATE TABLE `Students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ho_ten` VARCHAR(150) NOT NULL,
  `lop` VARCHAR(50) DEFAULT NULL,
  `ngay_sinh` DATE DEFAULT NULL,
  `gioi_tinh` ENUM('Nam', 'Nữ') DEFAULT 'Nam',
  `gvcn` VARCHAR(150) DEFAULT NULL,
  `parent_id` INT NOT NULL,
  `default_route_stop_id` INT DEFAULT NULL
  
  FOREIGN KEY (`parent_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`default_route_stop_id`) REFERENCES `RouteStops`(`id`) ON DELETE SET NULL;
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 8: `Schedules` (Lịch Trình / Chuyến Đi)
-- *** CẬP NHẬT: driver_id và bus_id cho phép NULL (có thể phân công sau)
-- *** CẬP NHẬT: Xóa unique indexes để cho phép tài xế/xe chạy cả lượt đi và lượt về trong cùng ngày
--
CREATE TABLE `Schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `route_id` INT NOT NULL,
  `driver_id` INT DEFAULT NULL,
  `bus_id` INT DEFAULT NULL,
  `ngay_chay` DATE NOT NULL,
  `trang_thai` ENUM('chuabatdau', 'dangchay', 'hoanthanh', 'huy') DEFAULT 'chuabatdau',
  `gio_bat_dau` TIME NOT NULL DEFAULT '06:00:00',
  `thoi_gian_bat_dau_thuc_te` DATETIME DEFAULT NULL,
  `thoi_gian_ket_thuc_thuc_te` DATETIME DEFAULT NULL,
  
  FOREIGN KEY (`route_id`) REFERENCES `Routes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`driver_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`bus_id`) REFERENCES `Buses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

-- Bảng 9: `ScheduleStudents` (Học Sinh Trên Lịch Trình)
-- *** CẬP NHẬT: Đã bỏ cột seat_id ***
--
CREATE TABLE `ScheduleStudents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `stop_id` INT NOT NULL,
  `trang_thai_don` ENUM('choxacnhan', 'dihoc', 'vangmat', 'daxuong') DEFAULT 'choxacnhan',
  
  `thoi_gian_don_thuc_te` DATETIME DEFAULT NULL,
  
  FOREIGN KEY (`schedule_id`) REFERENCES `Schedules`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `Students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stop_id`) REFERENCES `Stops`(`id`),
  UNIQUE KEY `student_on_schedule` (`schedule_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 10: `LocationHistory` (Lịch Sử Vị Trí)
--
CREATE TABLE `LocationHistory` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT NOT NULL,
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`schedule_id`) REFERENCES `Schedules`(`id`) ON DELETE CASCADE,
  INDEX `idx_schedule_time` (`schedule_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 11: `Notifications` (Thông Báo - Gộp chung)
--
CREATE TABLE `Notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id_gui` INT DEFAULT NULL,
  `user_id_nhan` INT NOT NULL,
  `schedule_id` INT DEFAULT NULL,
  `noi_dung` TEXT NOT NULL,
  `loai` ENUM('canhbao_sapden', 'canhbao_trexe', 'suco_taixe', 'tinnhan') NOT NULL,
  `da_doc` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id_gui`) REFERENCES `Users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id_nhan`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`schedule_id`) REFERENCES `Schedules`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Lịch sử phân công
CREATE TABLE `AssignmentHistory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tuyen` VARCHAR(255) NOT NULL ,
  `thao_tac` VARCHAR(255) NOT NULL,
  `loai_tuyen` ENUM('luot_di', 'luot_ve') DEFAULT NULL,
  `thoi_gian` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `ngay_chay_thuc_te` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
