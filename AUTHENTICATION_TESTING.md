# 🔐 Authentication & API Testing Guide

## ✅ LATEST FIXES APPLIED (Phase 5)

### What Was Fixed

#### 1. Double `.data` Extraction ✅

**Error:** "Cannot read properties of undefined (reading 'data')"  
**Root Cause:** `stop.service.js` accessing `response.data.data` when `api.js` already extracts `.data`  
**Fix Applied:**

```javascript
// BEFORE (BROKEN):
return response.data.data || [];

// AFTER (FIXED):
return Array.isArray(response) ? response : response.data || [];
```

**Files Updated:**

- `frontend/src/services/stop.service.js` lines 14, 36

#### 2. Missing Authentication Check ✅

**Error:** API calls made without verifying user was logged in  
**Fix Applied:**

```javascript
// Added in Dashboard.jsx before API calls:
const token = sessionStorage.getItem("token");
if (!token) {
  alert("Vui lòng đăng nhập trước khi bắt đầu chuyến đi");
  setTripStarted(false);
  return [];
}
```

**File Updated:**

- `frontend/src/pages/driver/Dashboard.jsx` lines 635-642

---

## 🚀 Quick Start Testing

### Prerequisites

- Node.js installed
- MySQL running on port 3306
- Both backend and frontend dependencies installed

### Step 1: Start Backend

```powershell
cd c:\Users\LENOVO-PC\Desktop\CNPM\CNPM_SSB1.0\backend
npm start
```

**Expected Output:**

```
Server running on port 8080
Database connection established
```

### Step 2: Start Frontend

```powershell
cd c:\Users\LENOVO-PC\Desktop\CNPM\CNPM_SSB1.0\frontend
npm run dev
```

**Expected Output:**

```
VITE v5.x.x ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 3: Login with Test Credentials

Navigate to `http://localhost:5173` and login as driver:

| Username | Password | Full Name    |
| -------- | -------- | ------------ |
| `taixe1` | `123456` | Nguyễn Văn A |
| `taixe2` | `123456` | Trần Văn B   |
| `taixe3` | `123456` | Lê Văn C     |
| `taixe4` | `123456` | Phạm Văn D   |
| `taixe5` | `123456` | Hoàng Văn E  |

**Result:** Login successful → Redirected to Dashboard with token in sessionStorage

### Step 4: Verify Token

Press `F12` (DevTools) and in Console:

```javascript
sessionStorage.getItem("token");
// Should return: "eyJhbGc..." (JWT token)
```

### Step 5: Start a Trip

Click "**Bắt Đầu Chuyến Đi**" (Start Trip) button

**Expected Results:**

- ✅ No console errors
- ✅ Bus appears on map
- ✅ No `401 Unauthorized` messages
- ✅ Position updates in real-time

### Step 6: Test Auto-Modal

Move bus near a stop (< 100m) by dragging on map

**Expected Results:**

- ✅ Modal auto-opens showing:
  - Stop name and address
  - Student list with names and classes
  - Pickup/dropoff status
- ✅ No console errors about undefined data

---

## 🔍 API Testing with Token

### Test Endpoint Directly

1. **Login first and get token** from sessionStorage
2. **Copy the token value** (starts with "eyJhbGc")
3. **Run in PowerShell:**

```powershell
$token = "eyJhbGc..." # Paste actual token

Invoke-WebRequest -Uri "http://localhost:8080/api/schedules/1/students-by-stop" `
  -Headers @{Authorization="Bearer $token"} `
  -Method GET | ConvertTo-Json
```

**Expected Response (Success):**

```json
[
  {
    "student_id": 1,
    "ho_ten": "Student Name",
    "class": "10A",
    "trang_thai_don": "Chờ đón"
  }
]
```

**Expected Response (No Token):**

```json
{
  "message": "❌ Không có token, vui lòng đăng nhập!"
}
```

→ Status: 401 Unauthorized

---

## 🐛 Debugging Checklist

### Authentication Issues

- [ ] Backend running on port 8080
- [ ] Frontend running on port 5173
- [ ] Can login with test credentials
- [ ] Token appears in sessionStorage after login
- [ ] Token has value (not null/empty)

### API Response Issues

- [ ] Open DevTools Network tab
- [ ] Click "Start Trip"
- [ ] Find requests to `/api/schedules/...`
- [ ] Verify `Authorization: Bearer <token>` header present
- [ ] Check response status is 200 (not 401)
- [ ] Response body contains array of students

### Console Errors

- [ ] No `401 Unauthorized` errors
- [ ] No `Cannot read properties of undefined (reading 'data')` errors
- [ ] No `Not authenticated! No token found` errors
- [ ] Should see success logs:
  - `"📚 Students by stop response: [...]"`
  - `"📍 Stop distances response: [...]"`

---

## 📊 Authentication Flow Diagram

```
┌─────────────┐
│   Browser   │
│             │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│  Login Page          │
│  (taixe1, 123456)    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Backend Auth        │
│  POST /login         │
│  Verify vai_tro      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  JWT Token Issued    │
│  Return to Frontend  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  sessionStorage      │
│  token = "eyJh..."   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Dashboard Ready     │
│  Can start trip      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  API Calls Include   │
│  Authorization       │
│  Bearer: token       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Backend Verifies    │
│  Token in Header     │
│  Check vai_tro       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Return Student Data │
│  Or 401 if Invalid   │
└──────────────────────┘
```

---

## 🚨 Common Issues & Solutions

### Issue: "Phiên đăng nhập hết hạn" (Session expired)

**Symptom:** Alert appears when starting trip  
**Solution:**

1. Logout
2. Clear sessionStorage: Press F12 → Application → Clear sessionStorage
3. Login again with fresh credentials

### Issue: "Vui lòng đăng nhập" (Please login)

**Symptom:** Alert before trip even starts  
**Solution:**

1. Verify login was successful
2. Check sessionStorage has token: `sessionStorage.getItem("token") !== null`
3. Refresh page and try again

### Issue: Auto-modal doesn't appear

**Symptom:** Bus moves but no modal pops up  
**Solution:**

1. Open DevTools Console
2. Look for distance calculations
3. Drag bus closer to stop (< 100m)
4. Check if `/calculate-stop-distances` API returns data

### Issue: Student names show as "undefined"

**Symptom:** Modal appears but student data is blank  
**Solution:**

1. Check API response in Network tab
2. Verify response has `ho_ten` field (not `name`)
3. Check backend column names in schedule.service.js
4. Recent fix ensures correct `ho_ten` → `students` join

---

## 📁 Key Files Reference

### Frontend Authentication

- `frontend/src/services/api.js` - Auto-attaches token to all requests
- `frontend/src/pages/Login.jsx` - Stores token in sessionStorage
- `frontend/src/pages/driver/Dashboard.jsx` - Checks token before API calls ✅ UPDATED

### Frontend API Services

- `frontend/src/services/stop.service.js` - Handles stop/student data ✅ UPDATED
  - Fixed: `getStudentsByStop()` - line 14
  - Fixed: `calculateStopDistances()` - line 36

### Backend Authentication

- `backend/src/middlewares/auth.js` - `verifyToken` middleware
- `backend/src/api/schedule.routes.js` - Protected routes with `[verifyToken, isDriver]`

### Backend Services

- `backend/src/services/schedule.service.js` - Column names verified:
  - Student: `ho_ten` (not `name`)
  - Status: `trang_thai_don` (not `trang_thai`)
  - Stop: `stop_id` (not `diem_dung_id`)

---

## ✅ Success Indicators

After login and starting a trip, you should see:

1. ✅ No 401 errors in console
2. ✅ Token visible in sessionStorage
3. ✅ API calls have Authorization header
4. ✅ Students display with correct names and classes
5. ✅ Auto-modal triggers when < 100m from stop
6. ✅ No "undefined" errors in console
7. ✅ All messages in Vietnamese (Vietnamese UI)
8. ✅ Can proceed to next stop after pickup

---

## 🔧 Database Test Data

### Test Drivers (vai_tro = "taixe")

```sql
SELECT * FROM users WHERE vai_tro = 'taixe' LIMIT 5;
```

**Results:**
| ID | username | ho_ten | vai_tro | password_hash |
|---|---|---|---|---|
| 2 | taixe1 | Nguyễn Văn A | taixe | ... |
| 3 | taixe2 | Trần Văn B | taixe | ... |
| 4 | taixe3 | Lê Văn C | taixe | ... |
| 5 | taixe4 | Phạm Văn D | taixe | ... |
| 6 | taixe5 | Hoàng Văn E | taixe | ... |

### Test Routes & Schedules

```sql
SELECT s.schedule_id, s.trang_thai, r.trang_thai as route_status, b.bien_so, u.ho_ten
FROM schedules s
JOIN routes r ON s.route_id = r.route_id
JOIN buses b ON s.bus_id = b.bus_id
LEFT JOIN users u ON s.driver_id = u.user_id
WHERE DATE(s.ngay_tao) = CURDATE()
LIMIT 5;
```

---

## 📞 Support

**Backend Issues?**

- Check port 8080 is listening: `netstat -ano | findstr :8080`
- Check database connection: Look for "Database connection established" in logs
- Check auth middleware: Verify token format and expiry

**Frontend Issues?**

- Clear browser cache: Ctrl+Shift+Delete
- Check sessionStorage: F12 → Application → Session Storage
- Check console errors: F12 → Console tab

**Database Issues?**

- Verify MySQL is running: `mysql -u root -p`
- Check test data exists: Query tables `users`, `schedules`, `routes`, `students`
- Verify column names match code expectations

---

**Updated:** After Phase 5 - Authentication & API Response Fixes  
**Status:** Ready for End-to-End Testing ✅  
**Last Fix:** Double `.data` extraction and missing authentication check
