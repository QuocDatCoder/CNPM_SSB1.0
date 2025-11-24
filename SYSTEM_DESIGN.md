# TÀI LIỆU THIẾT KẾ HỆ THỐNG QUẢN LÝ XE BUÝT (BUS MANAGEMENT SYSTEM)

## 1. Tổng Quan (Overview)
Hệ thống cung cấp giải pháp quản lý vận hành xe buýt, bao gồm quản lý lộ trình, lịch trình, tài xế, xe buýt và theo dõi vị trí theo thời gian thực.
- **Backend:** Node.js (Express)
- **Database:** MariaDB / MySQL
- **Kiến trúc:** RESTful API, mô hình MVC (Model-View-Controller)

---

## 2. Mô Hình Yêu Cầu (Requirements)

### 2.1. Các tác nhân (Actors)
1.  **Admin (Quản trị viên):** Quản lý toàn bộ hệ thống (xe, tuyến, tài xế, lịch trình).
2.  **Driver (Tài xế):** Xem lịch trình được phân công, cập nhật trạng thái chuyến đi, gửi tọa độ (tracking).
3.  **User (Hành khách):** Tra cứu tuyến xe, xem lịch trình, xem vị trí xe hiện tại.

### 2.2. Chức năng chính (Functional Requirements)
* **Xác thực (Auth):** Đăng nhập, đăng ký, phân quyền (Admin/Driver/User).
* **Quản lý Tuyến (Routes):** Tạo mới, cập nhật lộ trình, quản lý các điểm dừng (Stops).
* **Quản lý Xe & Tài xế (Bus & Driver):** Quản lý thông tin xe, biển số, thông tin tài xế.
* **Lịch trình (Schedules):** Phân công xe và tài xế vào một tuyến đường cụ thể theo khung giờ.
* **Định vị (Tracking):** Ghi nhận tọa độ GPS từ tài xế và hiển thị realtime.
* **Thông báo (Notification):** Gửi thông báo về thay đổi lịch trình hoặc sự cố.

---

## 3. Kiến Trúc Hệ Thống (System Architecture)

Hệ thống hoạt động theo mô hình **Client-Server**:

```mermaid
graph TD
    Client[Mobile App / Web Frontend] -->|HTTP Request| API_Gateway[Node.js Express Server]
    API_Gateway -->|Auth Middleware| Controllers
    
    subgraph Backend Services
    Controllers -->|Logic| Services
    Services -->|Query| Database[(MariaDB/MySQL)]
    end
