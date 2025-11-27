# Hệ thống Đăng nhập SmartBus - Hướng dẫn sử dụng

## Tổng quan

Đã triển khai hệ thống đăng nhập hoàn chỉnh thay thế HomePage, với các tính năng:

- Đăng nhập bằng username hoặc email
- Xác thực JWT (JSON Web Token)
- Phân quyền theo vai trò (admin, tài xế, phụ huynh)
- Protected routes - bảo vệ các trang theo vai trò
- Nút đăng xuất trong sidebar

## Cấu trúc thay đổi

### Backend

#### 1. Auth Controller (`backend/src/api/controllers/auth.controller.js`)

- **POST /api/auth/login**: Endpoint đăng nhập
  - Nhận: `{ username, password }`
  - Kiểm tra user trong database (Users table)
  - So sánh mật khẩu (hỗ trợ cả plaintext và bcrypt hash)
  - Trả về JWT token và thông tin user

#### 2. Auth Routes (`backend/src/api/routes/auth.routes.js`)

- Định tuyến cho authentication
- Đã tích hợp vào `app.js`

#### 3. Environment Variables (`.env`)

```
JWT_SECRET=smartbus-secret-key-2024-change-this-in-production
JWT_EXPIRES_IN=24h
```

### Frontend

#### 1. Auth Service (`frontend/src/services/auth.service.js`)

- `login(username, password)`: Gọi API đăng nhập
- `logout()`: Xóa token và user info
- `getCurrentUser()`: Lấy thông tin user từ localStorage
- `getToken()`: Lấy JWT token
- `isAuthenticated()`: Kiểm tra đã đăng nhập
- `getUserRole()`: Lấy vai trò user

#### 2. Login Component (`frontend/src/components/login/login.jsx`)

- Form đăng nhập với validation
- Hiển thị lỗi khi đăng nhập thất bại
- Loading state khi đang xử lý
- Toggle hiển thị mật khẩu
- Tự động chuyển hướng theo vai trò sau khi đăng nhập

#### 3. Protected Route (`frontend/src/components/ProtectedRoute.jsx`)

- Component bảo vệ routes
- Kiểm tra authentication
- Kiểm tra vai trò phù hợp
- Redirect về login nếu chưa đăng nhập hoặc vai trò không đúng

#### 4. App.jsx

```jsx
<Route path="/" element={<LoginPage />} />
<Route path="/admin" element={
  <ProtectedRoute allowedRoles="admin">
    <AdminLayout />
  </ProtectedRoute>
} />
<Route path="/driver" element={
  <ProtectedRoute allowedRoles="taixe">
    <DriverLayout />
  </ProtectedRoute>
} />
<Route path="/parent" element={
  <ProtectedRoute allowedRoles="phuhuynh">
    <ParentLayout />
  </ProtectedRoute>
} />
```

#### 5. Sidebar Component

- Thêm nút "Đăng xuất" ở cuối sidebar
- Xác nhận trước khi đăng xuất
- Chuyển về trang login sau khi logout

## Cách sử dụng

### 1. Khởi động Backend

```bash
cd backend
npm start
```

### 2. Khởi động Frontend

```bash
cd frontend
npm run dev
```

### 3. Đăng nhập với tài khoản từ database

Dựa vào file `seed.sql`, có các tài khoản mẫu:

**Admin:**

- Username: `admin`
- Email: `admin@sbms.com`
- Password: `123456`
- Vai trò: `admin`

**Tài xế:**

- Username: `taixe1`, `taixe2`, `taixe3`, `taixe4`, `taixe5`
- Email: `taixe1@sbms.com`, `taixe2@sbms.com`, ...
- Password: `123456`
- Vai trò: `taixe`

**Phụ huynh:**

- Username: `ph1`, `ph2`, `ph3`, ..., `ph14`
- Email: `ph1@gmail.com`, `ph2@gmail.com`, ...
- Password: `123456`
- Vai trò: `phuhuynh`

### 4. Luồng đăng nhập

1. Mở ứng dụng -> Trang đăng nhập hiển thị
2. Nhập username/email và password
3. Click "Đăng nhập"
4. Hệ thống kiểm tra:
   - Thông tin đăng nhập có đúng không
   - Lấy vai trò của user
5. Chuyển hướng tự động:
   - `admin` → `/admin` (AdminLayout)
   - `taixe` → `/driver` (DriverLayout)
   - `phuhuynh` → `/parent` (ParentLayout)
6. User có thể đăng xuất bằng nút ở sidebar

## Bảo mật

### Token Storage

- JWT token lưu trong localStorage
- Thông tin user lưu trong localStorage (đã loại bỏ password_hash)

### Protected Routes

- Tất cả routes `/admin`, `/driver`, `/parent` đều được bảo vệ
- Phải đăng nhập mới truy cập được
- Vai trò phải phù hợp với route

### Password Handling

- Backend hỗ trợ cả plaintext (seed data) và bcrypt hash
- Trong production nên hash tất cả password

## Lưu ý quan trọng

1. **JWT Secret**: Thay đổi `JWT_SECRET` trong `.env` khi deploy production
2. **Password Security**: Hash tất cả password trong database khi deploy thật
3. **HTTPS**: Sử dụng HTTPS khi deploy production để bảo vệ token
4. **Token Expiry**: Token hết hạn sau 24h, user cần đăng nhập lại

## Mở rộng trong tương lai

1. **Refresh Token**: Thêm refresh token để tự động gia hạn session
2. **Forgot Password**: Chức năng quên mật khẩu
3. **Email Verification**: Xác thực email khi đăng ký
4. **2FA**: Two-factor authentication
5. **Session Management**: Quản lý nhiều phiên đăng nhập
6. **Password Policy**: Chính sách mật khẩu mạnh

## Troubleshooting

### Lỗi "Tên đăng nhập hoặc mật khẩu không đúng"

- Kiểm tra database có user không
- Kiểm tra password trong DB (plaintext hay hash)
- Check console log để xem error chi tiết

### Không thể truy cập route sau khi đăng nhập

- Kiểm tra token có được lưu trong localStorage không (F12 -> Application -> Local Storage)
- Kiểm tra vai trò user có đúng không
- Clear localStorage và đăng nhập lại

### Backend không kết nối được

- Kiểm tra backend đang chạy ở port 8080
- Kiểm tra database connection
- Check file `.env` có đúng thông tin không

---

**Tác giả**: GitHub Copilot
**Ngày**: 27/11/2024
**Version**: 1.0
