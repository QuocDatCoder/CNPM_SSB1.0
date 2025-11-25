# ✅ Migration to Backend API - Complete

## Các trang đã được cập nhật để sử dụng API

### 1. **Bus.jsx** - Quản lý xe buýt

- ✅ Import `BusService` và `RouteService`
- ✅ Load dữ liệu từ `BusService.getAllBuses()` và `RouteService.getAllRoutes()`
- ✅ Thêm state `loading` với loading indicator
- ✅ Cập nhật `handleDelete()` - gọi `BusService.deleteBus()`
- ✅ Cập nhật `handleSaveEdit()` - gọi `BusService.updateBus()`
- ✅ Cập nhật `handleSaveNewBus()` - gọi `BusService.createBus()`
- ✅ Reload data sau mỗi operation

### 2. **Drivers.jsx** - Quản lý tài xế

- ✅ Import `DriverService`
- ✅ Load dữ liệu từ `DriverService.getAllDrivers()`
- ✅ Thêm state `loading`
- ✅ Error handling với alert messages

### 3. **Student.jsx** - Quản lý học sinh

- ✅ Import `api` service
- ✅ Load dữ liệu từ `api.get("/students")`
- ✅ Thêm state `loading`
- ✅ Error handling

### 4. **RouteManagement.jsx** - Quản lý tuyến đường

- ✅ Import `RouteService`
- ✅ Load dữ liệu từ `RouteService.getAllRoutes()`
- ✅ Thêm state `loading`
- ✅ Error handling

### 5. **Schedule.jsx** - Quản lý lịch trình

- ✅ Import tất cả services: `RouteService`, `DriverService`, `BusService`, `ScheduleService`
- ✅ Load dữ liệu từ multiple APIs với `Promise.all()`
- ✅ Thêm state `loading`
- ✅ Load routes, drivers, buses, schedules cùng lúc

### 6. **Dashboard.jsx** - Trang chủ admin

- ✅ Import `RouteService`
- ✅ Load dữ liệu từ `RouteService.getAllRoutes()`
- ✅ Thêm state `loading`
- ✅ Auto-select first route khi load xong

## 🚀 Các bước tiếp theo

### 1. Khởi động Backend Server

```bash
cd CNPM_SSB1.0/backend
npm start
```

Server phải chạy trên: `http://localhost:8080`

### 2. Test API Connection

Mở browser console và chạy:

```javascript
import TestAPI from "./services/test-api.js";
TestAPI.testAll();
```

Hoặc test từng service:

```javascript
TestAPI.testBuses();
TestAPI.testDrivers();
TestAPI.testRoutes();
TestAPI.testSchedules();
```

### 3. Kiểm tra Frontend

```bash
cd CNPM_SSB1.0/frontend
npm run dev
```

Truy cập: `http://localhost:5173`

## 📊 Loading States

Tất cả các trang đều có loading indicator:

```jsx
if (loading) {
  return (
    <div className="page">
      <Header title="..." />
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}
```

## ⚠️ Error Handling

Mọi API call đều có error handling:

```javascript
try {
  const data = await Service.getData();
  setData(data);
} catch (error) {
  console.error("Error loading data:", error);
  alert("Không thể tải dữ liệu. Vui lòng kiểm tra kết nối backend.");
}
```

## 🔧 Cấu trúc Service Layer

**Base API Client** (`services/api.js`):

```javascript
class ApiClient {
  baseURL = "http://localhost:8080/api"
  get(endpoint, params)
  post(endpoint, data)
  put(endpoint, data)
  delete(endpoint)
}
```

**Các Service đã sử dụng**:

- `BusService` - CRUD operations cho xe buýt
- `DriverService` - Lấy danh sách tài xế từ Users table
- `RouteService` - Lấy tuyến đường (join 3 tables)
- `ScheduleService` - Quản lý lịch trình
- `api` - Direct API calls (cho Students)

## 📝 Notes

1. **Students API**: Hiện tại sử dụng direct API call vì chưa có StudentService. Bạn có thể tạo sau:

   ```javascript
   // services/student.service.js
   const StudentService = {
     getAllStudents: () => api.get("/students"),
     // ... more methods
   };
   ```

2. **Data Transformation**: Tất cả services đã tự động transform data từ DB format (Vietnamese) sang Frontend format (English)

3. **Reload Pattern**: Sau mỗi operation (create/update/delete), gọi `loadData()` để refresh danh sách

4. **Promise.all**: Schedule page load nhiều data cùng lúc để tối ưu performance

## ✨ Kết quả

- ✅ Tất cả trang admin đã migrate sang API
- ✅ Loading states cho UX tốt hơn
- ✅ Error handling đầy đủ
- ✅ Data transformation tự động
- ✅ CRUD operations hoàn chỉnh (Bus page)
- ✅ Ready for production testing

## 🐛 Troubleshooting

**Lỗi "Cannot GET /api/..."**:

- Kiểm tra backend server có đang chạy không
- Verify port 8080
- Check backend console logs

**Lỗi CORS**:

- Backend cần enable CORS cho localhost:5173
- Check backend middleware config

**Data không hiển thị**:

- Mở browser DevTools > Network tab
- Kiểm tra API responses
- Check console.error logs

**Loading mãi không xong**:

- API có thể bị timeout
- Check backend database connection
- Verify API endpoints match documentation

---

Tất cả các trang đã sẵn sàng sử dụng backend API! 🎉
