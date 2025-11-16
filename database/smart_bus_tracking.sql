-- phpMyAdmin SQL Dump
-- Tối ưu hóa cho dự án SSB 1.0
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
-- Lưu tất cả tài khoản trong hệ thống.
--
CREATE TABLE `Users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `ho_ten` VARCHAR(150) NOT NULL,
  `so_dien_thoai` VARCHAR(20) UNIQUE,
  `vai_tro` ENUM('admin', 'taixe', 'phuhuynh') NOT NULL,
  
  -- Thông tin thêm (chỉ dùng cho vai trò tương ứng)
  `dia_chi` VARCHAR(255) DEFAULT NULL, -- Dùng cho phụ huynh
  `bang_lai` VARCHAR(50) DEFAULT NULL, -- Dùng cho tài xế
  `trang_thai_taixe` ENUM('hoatdong', 'nghi', 'tamdung') DEFAULT NULL, -- Dùng cho tài xế
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 2: `Buses` (Xe Buýt)
--
CREATE TABLE `Buses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bien_so_xe` VARCHAR(20) NOT NULL UNIQUE,
  `so_ghe` INT DEFAULT 30,
  `trang_thai` ENUM('hoatdong', 'baotri', 'ngung') DEFAULT 'hoatdong'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 3: `Stops` (Điểm Dừng)
-- Master list các điểm có thể đón/trả.
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
-- Bảng 4: `Routes` (Tuyến Đường)
-- Định nghĩa các tuyến đường (template). Ví dụ: "Tuyến 1 - Đón Sáng", "Tuyến 1 - Trả Chiều".
--
CREATE TABLE `Routes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ten_tuyen` VARCHAR(200) NOT NULL,
  `mo_ta` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 5: `RouteStops` (Các Điểm Dừng Của Tuyến)
-- Rất quan trọng: Định nghĩa một tuyến (Route) bao gồm những điểm dừng (Stop) nào,
-- theo thứ tự và giờ giấc dự kiến.
--
CREATE TABLE `RouteStops` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `route_id` INT NOT NULL,
  `stop_id` INT NOT NULL,
  `thu_tu` INT NOT NULL, -- Thứ tự dừng (1, 2, 3...)
  `gio_don_du_kien` TIME DEFAULT NULL, -- Giờ dự kiến đón/trả tại điểm này
  
  FOREIGN KEY (`route_id`) REFERENCES `Routes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stop_id`) REFERENCES `Stops`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `route_stop_order` (`route_id`, `thu_tu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 6: `Students` (Học Sinh)
-- Liên kết trực tiếp với Phụ huynh (Users).
--
CREATE TABLE `Students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ho_ten` VARCHAR(150) NOT NULL,
  `lop` VARCHAR(50) DEFAULT NULL,
  `parent_id` INT NOT NULL, -- Liên kết 1-N với Phụ Huynh (Users)
  `default_stop_id` INT DEFAULT NULL, -- Điểm đón mặc định (có thể bị ghi đè)
  
  FOREIGN KEY (`parent_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`default_stop_id`) REFERENCES `Stops`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 7: `Schedules` (Lịch Trình / Chuyến Đi)
-- Đây là bảng `phancong` cũ. Là một "chuyến đi" (trip) cụ thể,
-- diễn ra trên một "Tuyến đường" (Route), vào một "Ngày" (ngay_chay),
-- bởi một "Tài xế" (driver_id) và "Xe buýt" (bus_id).
--
CREATE TABLE `Schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `route_id` INT NOT NULL,
  `driver_id` INT NOT NULL,
  `bus_id` INT NOT NULL,
  `ngay_chay` DATE NOT NULL,
  `trang_thai` ENUM('chuabatdau', 'dangchay', 'hoanthanh', 'huy') DEFAULT 'chuabatdau',
  
  `thoi_gian_bat_dau_thuc_te` DATETIME DEFAULT NULL,
  `thoi_gian_ket_thuc_thuc_te` DATETIME DEFAULT NULL,
  
  FOREIGN KEY (`route_id`) REFERENCES `Routes`(`id`),
  FOREIGN KEY (`driver_id`) REFERENCES `Users`(`id`), -- Phải là user có vai_tro = 'taixe'
  FOREIGN KEY (`bus_id`) REFERENCES `Buses`(`id`),
  UNIQUE KEY `driver_day` (`driver_id`, `ngay_chay`), -- 1 tài xế 1 ngày chỉ 1 lịch? (Tùy chỉnh)
  UNIQUE KEY `bus_day` (`bus_id`, `ngay_chay`) -- 1 xe 1 ngày chỉ 1 lịch? (Tùy chỉnh)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 8: `ScheduleStudents` (Học Sinh Trên Lịch Trình)
-- Bảng "điểm danh" quan trọng nhất. Thay thế `hocsinh_tuyenduong`.
-- Cho biết học sinh nào có mặt trên chuyến đi (Schedule) nào,
-- và trạng thái đón của em đó.
--
CREATE TABLE `ScheduleStudents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `stop_id` INT NOT NULL, -- Điểm đón thực tế cho chuyến này (thường lấy từ default_stop_id của học sinh)
  `trang_thai_don` ENUM('choxacnhan', 'dihoc', 'vangmat') DEFAULT 'choxacnhan',
  `thoi_gian_don_thuc_te` DATETIME DEFAULT NULL,
  
  FOREIGN KEY (`schedule_id`) REFERENCES `Schedules`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `Students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stop_id`) REFERENCES `Stops`(`id`),
  UNIQUE KEY `student_on_schedule` (`schedule_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 9: `LocationHistory` (Lịch Sử Vị Trí)
-- Tối ưu từ `vitrixe`. Liên kết trực tiếp với `schedule_id` (chuyến đi).
--
CREATE TABLE `LocationHistory` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT NOT NULL, -- Liên kết với chuyến đi cụ thể
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`schedule_id`) REFERENCES `Schedules`(`id`) ON DELETE CASCADE,
  INDEX `idx_schedule_time` (`schedule_id`, `timestamp`) -- Tăng tốc query lịch sử
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Bảng 10: `Notifications` (Thông Báo)
-- Gộp `thongbao` và `baocao` lại làm một.
-- Dùng để tài xế báo cáo sự cố (loai = 'suco_taixe')
-- Dùng để hệ thống cảnh báo (loai = 'canhbao_sapden')
-- Dùng để admin/phụ huynh nhắn tin (loai = 'tinnhan')
--
CREATE TABLE `Notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id_gui` INT DEFAULT NULL, -- FK Users (NULL nếu là hệ thống)
  `user_id_nhan` INT NOT NULL, -- FK Users (Phụ huynh, Admin...)
  `schedule_id` INT DEFAULT NULL, -- Liên kết với 1 chuyến đi nếu là báo cáo sự cố
  `noi_dung` TEXT NOT NULL,
  `loai` ENUM('canhbao_sapden', 'canhbao_trexe', 'suco_taixe', 'tinnhan') NOT NULL,
  `da_doc` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id_gui`) REFERENCES `Users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id_nhan`) REFERENCES `Users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`schedule_id`) REFERENCES `Schedules`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


COMMIT;