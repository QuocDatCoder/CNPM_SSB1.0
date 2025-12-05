# 🚀 QUICK START - 5 Minute Testing

## ⚡ TL;DR - What Was Fixed

| Issue                                 | Fix                             | File              | Status  |
| ------------------------------------- | ------------------------------- | ----------------- | ------- |
| "Cannot read properties of undefined" | Fixed double `.data` extraction | `stop.service.js` | ✅ DONE |
| 401 errors not handled                | Added token check before API    | `Dashboard.jsx`   | ✅ DONE |

---

## 🎯 Test in 5 Steps

### 1. Start Backend (30 sec)

```powershell
cd c:\Users\LENOVO-PC\Desktop\CNPM\CNPM_SSB1.0\backend
npm start
```

✅ Should see: `Server running on port 8080`

### 2. Start Frontend (30 sec)

```powershell
cd c:\Users\LENOVO-PC\Desktop\CNPM\CNPM_SSB1.0\frontend
npm run dev
```

✅ Should see: `Local: http://localhost:5173`

### 3. Login (1 min)

- Go to `http://localhost:5173`
- Username: `taixe1`
- Password: `123456`
- Click Login

✅ Should see Dashboard with map

### 4. Start Trip (1 min)

- Click **"Bắt Đầu Chuyến Đi"** button
- Bus appears on map

✅ Should see:

- No console errors ✅
- No 401 errors ✅
- Bus moving on map ✅

### 5. Test Auto-Modal (1.5 min)

- Drag bus near a stop (< 100m)
- Or wait for auto-movement

✅ Should see:

- Modal auto-opens
- Student list displays
- Names and classes visible
- NO undefined errors

---

## 🔍 Quick Verification

**Open DevTools (F12) and run:**

```javascript
// Check token
sessionStorage.getItem("token");
// Result: Should start with "eyJhbGc"

// Check for success logs
// You should see in console:
// ✅ "📚 Students by stop response: [...]"
// ✅ "📍 Stop distances response: [...]"
```

---

## 📋 Test Credentials

| Role     | Username | Password |
| -------- | -------- | -------- |
| Driver 1 | `taixe1` | `123456` |
| Driver 2 | `taixe2` | `123456` |
| Driver 3 | `taixe3` | `123456` |
| Driver 4 | `taixe4` | `123456` |
| Driver 5 | `taixe5` | `123456` |

---

## ✅ Expected Outcomes

### ✅ Success Signs

- [ ] Login works with taixe1/123456
- [ ] Bus appears on map after "Start Trip"
- [ ] No "Cannot read properties" errors
- [ ] No "401 Unauthorized" errors
- [ ] Modal pops up when bus near stop
- [ ] Student names display correctly
- [ ] Student classes display correctly

### ❌ If You See These

| Error                     | Fix                                     |
| ------------------------- | --------------------------------------- |
| "Vui lòng đăng nhập"      | Need to login first                     |
| "Phiên đăng nhập hết hạn" | Logout and login again                  |
| "Cannot read properties"  | Refresh page, try again                 |
| "401 Unauthorized"        | Check if token exists in sessionStorage |
| Modal doesn't appear      | Drag bus closer to stop                 |

---

## 🔧 Troubleshooting

**Backend won't start?**

```powershell
# Check if port 8080 is free
netstat -ano | findstr :8080
# Kill if needed: taskkill /PID <PID> /F
```

**Frontend won't start?**

```powershell
# Check if port 5173 is free
netstat -ano | findstr :5173
```

**Can't login?**

```powershell
# Verify database has test users
# Run: mysql -u root -p smart_bus_tracking
# Query: SELECT * FROM users WHERE vai_tro = 'taixe';
```

---

## 📞 Files Modified

1. ✅ `frontend/src/services/stop.service.js` (lines 14, 36)
2. ✅ `frontend/src/pages/driver/Dashboard.jsx` (lines 635-670)

**No other files changed** - Everything else already correct!

---

## 📚 Full Documentation

- **Detailed Guide:** `AUTHENTICATION_TESTING.md`
- **Complete Report:** `PHASE5_COMPLETION.md`
- **Architecture:** `ARCHITECTURE_DIAGRAM.md`

---

**Status:** ✅ Ready to Test  
**Time to Verify:** ~5 minutes  
**Expected Result:** All features working without errors
