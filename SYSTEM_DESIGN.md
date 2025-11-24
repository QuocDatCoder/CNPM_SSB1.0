TÀI LIỆU THIẾT KẾ HỆ THỐNG QUẢN LÝ XE BUÝT (BUS MANAGEMENT SYSTEM)
1. Tổng Quan (Overview)
Hệ thống cung cấp giải pháp quản lý vận hành xe buýt toàn diện trên nền tảng Web. Hệ thống kết nối dữ liệu thời gian thực giữa xe buýt, máy chủ và người dùng thông qua bản đồ số.

Thông tin kỹ thuật cốt lõi:
Frontend (Giao diện): ReactJS (Single Page Application).

Backend (Xử lý): Node.js + Express Framework.

Database (Lưu trữ): MariaDB / MySQL.

Map Service (Bản đồ): Google Maps Platform.

Real-time: Socket.io.

2. Công Nghệ Sử Dụng (Technology Stack)
2.1. Frontend (Client-Side)
Core Framework: ReactJS (Xây dựng giao diện tương tác cao, SPA).

Map Integration: Google Maps JavaScript API (Hiển thị bản đồ, Marker xe buýt, vẽ lộ trình).

State Management: Context API hoặc Redux.

HTTP Client: Axios.

2.2. Backend (Server-Side)
Runtime: Node.js.

API Framework: Express.js (RESTful API).

Real-time Engine: Socket.io (Truyền tải tọa độ GPS độ trễ thấp).

External Service Integration: Google Maps Directions API (Tính toán lộ trình/khoảng cách phía server nếu cần).

2.3. Database (Persistence)
RDBMS: MariaDB hoặc MySQL.

Driver: mysql2 (Thư viện kết nối hiệu năng cao cho Node.js).

3. Kiến Trúc Hệ Thống (System Architecture)
Hệ thống hoạt động theo mô hình Client-Server kết hợp với dịch vụ bản đồ bên thứ 3 (Google Maps).

3.1. Sơ đồ kiến trúc tổng quan
Đoạn mã

graph TD
    subgraph "Client Layer (Frontend)"
        ReactApp[💻/📱 <b>ReactJS Web Application</b><br/>(Admin / Driver / User Views)]
    end

    subgraph "External Services"
        GoogleMaps[🌍 <b>Google Maps Platform</b><br/>(Maps JS API / Directions / Geocoding)]
    end

    subgraph "Backend Layer"
        NodeServer[<b>Node.js Express Server</b><br/>(API Gateway & Socket Server)]
    end

    subgraph "Data Layer"
        DB[(<b>MariaDB / MySQL</b><br/>Database)]
    end

    %% Luồng tương tác
    ReactApp -->|1. Load Map & Assets| GoogleMaps
    ReactApp -->|2. REST API (Auth, Data)| NodeServer
    ReactApp -.->|3. Realtime GPS (WebSocket)| NodeServer
    
    NodeServer -->|4. Query/Save Data| DB
    NodeServer -.->|5. Broadcast Location| ReactApp
3.2. Luồng xử lý dữ liệu với Google Maps
Hiển thị: React App tải trực tiếp bản đồ từ máy chủ Google Maps về trình duyệt người dùng.

Dữ liệu nghiệp vụ: React App gọi API lên Node.js Server để lấy danh sách các điểm dừng (Lat/Lng) và lộ trình.

Vẽ lộ trình: React App sử dụng dữ liệu từ Server để vẽ đường đi (Polyline) và ghim điểm dừng (Markers) lên lớp bản đồ Google Maps.

4. Mô Hình Yêu Cầu & Chức Năng (Functional Requirements)
Hệ thống React Frontend được chia thành 3 phân hệ (Views) dựa trên quyền người dùng:

4.1. Admin Dashboard (Web React)
Quản lý hạ tầng: CRUD Xe, Tuyến đường, Điểm dừng.

Điều phối: Lập lịch trình (Schedule) cho tài xế.

Giám sát: Xem bản đồ Google Maps hiển thị vị trí toàn bộ đội xe đang hoạt động.

4.2. Driver Interface (Mobile Web React)
Nhận việc: Xem lịch trình phân công.

Tracking:

Sử dụng GPS của thiết bị.

Liên tục gửi tọa độ về Server qua Socket.io.

Hiển thị vị trí hiện tại của mình trên Google Maps nền.

4.3. Passenger Portal (Public Web React)
Tra cứu: Tìm kiếm tuyến xe.

Theo dõi:

Xem xe đang chạy đến đâu trên Google Maps.
