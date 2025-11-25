# 🚀 HƯỚNG DẪN KẾT NỐI BACKEND - SMART BUS TRACKING

## 📋 Tổng quan

Đã tạo các service layer để kết nối frontend với backend API (http://localhost:8080/api)

## 📂 Cấu trúc Services

```
frontend/src/services/
├── api.js                 # Base API client (fetch wrapper)
├── bus.service.js         # Quản lý xe buýt
├── driver.service.js      # Quản lý tài xế
├── route.service.js       # Quản lý tuyến đường & trạm
├── schedule.service.js    # Quản lý lịch trình
├── admin.service.js       # Tổng hợp cho Admin
└── test-api.js           # Test kết nối API
```

## ✅ So sánh Database vs Frontend Data

### 1. **Buses (Xe buýt)** ✅ KHỚP HOÀN TOÀN

```javascript
// Database (API Response)
{
  id: 1,
  licensePlate: "59A-400000",
  manufacturer: "toyota",
  seats: 40,
  yearManufactured: 2005,
  distanceTraveled: 1000,
  maintenanceDate: "2024-12-12",
  status: "đang hoạt động"
}

// Frontend Data (đã có)
{
  id: "001",
  licensePlate: "59A-400000",
  manufacturer: "toyota",
  seats: 40,
  yearManufactured: 2005,
  distanceTraveled: 1000,
  maintenanceDate: "2121-12-12",
  status: "đang hoạt động",
  route: "Tuyến 1 - An Dương Vương",
  image: "/image/bus.png"
}
```

### 2. **Routes (Tuyến đường)** ✅ CẦN MAPPING

```javascript
// Database
Routes: { ten_tuyen, mo_ta, khoang_cach, khung_gio, loai_tuyen }
RouteStops: { route_id, stop_id, thu_tu, gio_don_du_kien }
Stops: { ten_diem, dia_chi, latitude, longitude }

// Frontend
{
  id: "001",
  name: "Tuyến 1",
  street: "An Dương Vương",
  distance: "5km",
  time: "4:00–6:00",
  stops: [{ id, name, position: [lat, lng], time }]
}

// ✅ Service đã tự động mapping
```

### 3. **Drivers (Tài xế)** ✅ KHỚP

```javascript
// Database (Users table, vai_tro='taixe')
{
  id: 1,
  username: "driver001",
  ho_ten: "Nguyễn Văn A",
  email: "nvA@example.com",
  so_dien_thoai: "0987654321",
  dia_chi: "Quận 1",
  bang_lai: "LX-123456",
  trang_thai_taixe: "hoatdong"
}

// Frontend Data
{
  code: "0001",
  fullname: "Nguyễn Văn A",
  phone: "0987654321",
  address: "Quận 1",
  email: "nvA@example.com",
  licenseNumber: "LX-123456"
}
```

### 4. **Schedules (Lịch trình)** ✅ MỚI

```javascript
// Database
{
  id: 1,
  route_id: 1,
  driver_id: 2,
  bus_id: 1,
  ngay_chay: "2025-12-25",
  gio_bat_dau: "06:00:00",
  trang_thai: "chuabatdau"
}

// Frontend sẽ cần format lại cho UI
```

## 🔧 Cách sử dụng

### 1. Test kết nối API

```javascript
import TestAPI from "./services/test-api";

// Test tất cả APIs
await TestAPI.testAll();

// Hoặc test từng cái
await TestAPI.testBuses();
await TestAPI.testDrivers();
await TestAPI.testRoutes();
await TestAPI.testSchedules();
```

### 2. Sử dụng trong Components

#### Example 1: Lấy danh sách xe (Bus.jsx)

```javascript
import { useState, useEffect } from "react";
import BusService from "../../services/bus.service";

function Bus() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    try {
      setLoading(true);
      const data = await BusService.getAllBuses();
      setBuses(data);
    } catch (error) {
      console.error("Error loading buses:", error);
      alert("Không thể tải danh sách xe!");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (busData) => {
    try {
      await BusService.createBus(busData);
      alert("Thêm xe thành công!");
      loadBuses(); // Reload
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleUpdate = async (id, busData) => {
    try {
      await BusService.updateBus(id, busData);
      alert("Cập nhật thành công!");
      loadBuses();
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Xác nhận xóa?")) {
      try {
        await BusService.deleteBus(id);
        alert("Xóa thành công!");
        loadBuses();
      } catch (error) {
        alert("Lỗi: " + error.message);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {buses.map((bus) => (
        <div key={bus.id}>
          {bus.licensePlate} - {bus.status}
        </div>
      ))}
    </div>
  );
}
```

#### Example 2: Lấy tuyến đường (Dashboard.jsx)

```javascript
import RouteService from "../../services/route.service";

function Dashboard() {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    async function loadRoutes() {
      try {
        const data = await RouteService.getAllRoutes();
        setRoutes(data);
      } catch (error) {
        console.error("Error:", error);
      }
    }
    loadRoutes();
  }, []);

  return (
    <div>
      {routes.map((route) => (
        <div key={route.id}>
          <h3>{route.name}</h3>
          <p>Điểm đầu: {route.startName}</p>
          <p>Điểm cuối: {route.endName}</p>
          {/* Hiển thị map với route.stops */}
        </div>
      ))}
    </div>
  );
}
```

#### Example 3: Phân công lịch trình (Admin)

```javascript
import ScheduleService from "../../services/schedule.service";

async function createAssignment(data) {
  try {
    const scheduleData = {
      route_id: data.routeId,
      driver_id: data.driverId,
      bus_id: data.busId,
      ngay_chay: "2025-12-25", // YYYY-MM-DD
      gio_bat_dau: "06:00:00", // HH:MM:SS
    };

    await ScheduleService.createSchedule(scheduleData);
    alert("Phân công thành công!");
  } catch (error) {
    alert("Lỗi: " + error.message);
    // Có thể là lỗi trùng tài xế hoặc xe
  }
}
```

## 🎯 Endpoints đã implement

### Buses

- ✅ GET `/api/buses` - Lấy tất cả xe
- ✅ POST `/api/buses` - Thêm xe mới
- ✅ PUT `/api/buses/:id` - Cập nhật xe
- ✅ DELETE `/api/buses/:id` - Xóa xe

### Routes & Stops

- ✅ GET `/api/routes` - Lấy tất cả tuyến
- ✅ GET `/api/routes/:id` - Chi tiết tuyến
- ✅ GET `/api/routes/:id/stops` - Trạm của tuyến
- ✅ GET `/api/stops` - Tất cả trạm

### Drivers

- ✅ GET `/api/driver-test` - Lấy tất cả tài xế

### Schedules

- ✅ GET `/api/schedules` - Lấy tất cả lịch
- ✅ POST `/api/schedules` - Tạo lịch mới
- ✅ PUT `/api/schedules/:id` - Cập nhật lịch
- ✅ DELETE `/api/schedules/:id` - Xóa lịch
- ✅ GET `/api/schedules/admin/driver/:id` - Lịch tuần
- ✅ GET `/api/schedules/driver/my-schedule/:id` - Lịch tài xế
- ✅ GET `/api/schedules/history/logs` - Lịch sử

## 📝 Ghi chú quan trọng

### 1. Format dữ liệu

- **Date**: `YYYY-MM-DD` (VD: "2025-12-25")
- **Time**: `HH:MM:SS` (VD: "06:00:00")
- **Status xe**: "đang hoạt động", "bảo trì", "ngừng hoạt động"
- **Loại tuyến**: "luot_di", "luot_ve"

### 2. Validation

- Backend đã check trùng tài xế/xe trong cùng ngày
- Các field required phải có giá trị
- ID phải là số nguyên

### 3. Error Handling

```javascript
try {
  const data = await BusService.getAllBuses();
} catch (error) {
  console.error(error.message);
  // Hiển thị thông báo lỗi cho user
}
```

## 🔄 Migration từ Mock Data

### Thay thế import

```javascript
// CŨ
import busesData from "../../data/buses";

// MỚI
import BusService from "../../services/bus.service";
const buses = await BusService.getAllBuses();
```

### Loading state

```javascript
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function load() {
    setLoading(true);
    try {
      const data = await BusService.getAllBuses();
      setBuses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
  load();
}, []);
```

## 🚦 Kiểm tra Backend đang chạy

```bash
# Terminal 1: Backend
cd backend
npm start
# Nên thấy: Server running on port 8080

# Terminal 2: Frontend
cd frontend
npm run dev
# Nên thấy: Local: http://localhost:5173
```

## ✨ Next Steps

1. **Test API ngay** với `test-api.js`
2. **Thay thế mock data** trong các component
3. **Thêm loading states** cho UX tốt hơn
4. **Handle errors** đúng cách
5. **Add authentication** nếu cần (JWT tokens)

---

**Lưu ý**: Database schema đã hoàn toàn tương thích với frontend data structure. Services đã tự động mapping giữa DB format (tiếng Việt) và Frontend format (tiếng Anh).
