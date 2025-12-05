# 🚀 Quick Start - API Testing Guide

## ⚡ 5-Minute Setup

### 1. Database Setup

```bash
# Drop old database
mysql -u root -p -e "DROP DATABASE IF EXISTS smart_bus_tracking;"

# Create new schema with dual-direction columns
mysql -u root -p < database/smart_bus_tracking.sql

# Seed with complete test data (70 ScheduleStudents)
mysql -u root -p smart_bus_tracking < database/seed.sql
```

### 2. Backend Start

```bash
cd backend
npm start
# Should see: "✅ Server running on port 8080"
```

### 3. Quick Test

```bash
# Test 1: Get all students (verify dual columns)
curl http://localhost:8080/api/students | jq '.data[0]'

# Expected output:
# {
#   "id": 1,
#   "ho_ten": "Nguyễn Văn Tèo",
#   "default_route_stop_id_di": 1,     ✅ Morning
#   "default_route_stop_id_ve": 14,    ✅ Afternoon
#   ...
# }

# Test 2: Parent dashboard (2 trips per child)
curl "http://localhost:8080/api/schedules/parent/my-kids-trip" \
  -H "Cookie: userId=7; vai_tro=phuhuynh" | jq '.data[0]'

# Expected output:
# {
#   "student_id": 1,
#   "ten_con": "Nguyễn Văn Tèo",
#   "danh_sach_chuyen": [
#     {"loai_chuyen": "Lượt đi (Đón)", "gio_du_kien": "06:00"},     ✅ Morning
#     {"loai_chuyen": "Lượt về (Trả)", "gio_du_kien": "15:30"}      ✅ Afternoon
#   ]
# }
```

---

## 📋 Test Credentials

| Role     | Username | Password | ID  |
| -------- | -------- | -------- | --- |
| Admin    | admin    | 123456   | 1   |
| Driver 1 | taixe1   | 123456   | 2   |
| Parent 1 | ph1      | 123456   | 7   |
| Parent 2 | ph2      | 123456   | 8   |

---

## ✅ Key Test Cases

### Test 1: Verify Student Dual Columns

```bash
curl http://localhost:8080/api/students | jq '.data[0] | {
  id,
  ho_ten,
  default_route_stop_id_di,
  default_route_stop_id_ve,
  tuyen_duong_di,
  tuyen_duong_ve
}'
```

**Expected:**

```json
{
  "id": 1,
  "ho_ten": "Nguyễn Văn Tèo",
  "default_route_stop_id_di": 1,
  "default_route_stop_id_ve": 14,
  "tuyen_duong_di": "Tuyến 1",
  "tuyen_duong_ve": "Tuyến 1"
}
```

---

### Test 2: Parent Views Child's 2 Trips

```bash
curl "http://localhost:8080/api/schedules/parent/my-kids-trip" \
  -H "Cookie: userId=7; vai_tro=phuhuynh" | jq '.data[0].danh_sach_chuyen'
```

**Expected:** Array with 2 objects

```json
[
  {
    "schedule_id": 1,
    "loai_chuyen": "Lượt đi (Đón)",
    "gio_du_kien": "06:00:00",
    "ten_tuyen": "Tuyến 1",
    "diem_dung": "Crescent Mall"
  },
  {
    "schedule_id": 2,
    "loai_chuyen": "Lượt về (Trả)",
    "gio_du_kien": "15:30:00",
    "ten_tuyen": "Tuyến 1",
    "diem_dung": "Crescent Mall"
  }
]
```

---

### Test 3: Create Student with Both Directions

```bash
curl -X POST http://localhost:8080/api/students/with-parent \
  -H "Content-Type: application/json" \
  -d '{
    "ho_ten_hs": "New Student",
    "lop": "Lớp 1A",
    "ngay_sinh": "2020-01-01",
    "gioi_tinh": "Nam",
    "gvcn": "Teacher Name",
    "ho_ten_ph": "Parent Name",
    "sdt_ph": "0901234567",
    "email_ph": "parent@example.com",
    "route_id_di": 1,
    "stop_id_di": 5,
    "route_id_ve": 2,
    "stop_id_ve": 6
  }' | jq '.data.student'
```

**Expected:**

```json
{
  "id": 36,
  "ho_ten": "New Student",
  "default_route_stop_id_di": 1,
  "default_route_stop_id_ve": 14
}
```

**Verification:** Check if ScheduleStudents created

```bash
mysql -u root -p smart_bus_tracking -e "
SELECT count(*) as count FROM ScheduleStudents
WHERE student_id = 36;
"
# Expected: 2 (one for each route)
```

---

### Test 4: Auto-Assign Works

```bash
# Create new schedule for Route 1 (morning)
curl -X POST http://localhost:8080/api/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "route_id": 1,
    "driver_id": 2,
    "bus_id": 1,
    "ngay_chay": "2025-12-05",
    "gio_bat_dau": "06:00"
  }' | jq '.data.id'

# Verify auto-assign created ScheduleStudent records
mysql -u root -p smart_bus_tracking -e "
SELECT COUNT(*) as count FROM ScheduleStudents
WHERE schedule_id = (SELECT id FROM Schedules WHERE route_id = 1 ORDER BY id DESC LIMIT 1);
"
# Expected: 7 (number of students on Route 1)
```

---

### Test 5: Database Integrity

```bash
# Verify data counts
mysql -u root -p smart_bus_tracking -e "
SELECT
  (SELECT COUNT(*) FROM Users) as users,
  (SELECT COUNT(*) FROM Routes) as routes,
  (SELECT COUNT(*) FROM Students) as students,
  (SELECT COUNT(*) FROM Schedules) as schedules,
  (SELECT COUNT(*) FROM ScheduleStudents) as schedule_students;
"

# Expected:
# users | routes | students | schedules | schedule_students
#   46  |   10   |    35    |    10     |        70
```

---

### Test 6: Frontend Dashboard

```bash
# Start frontend
cd frontend
npm start
# Opens http://localhost:5173

# Login as parent: ph1 / 123456
# Should see:
# - Child: Nguyễn Văn Tèo
# - 2 trip cards (morning + afternoon)
# - Each with correct time, route, and driver info
```

---

## 🐛 Troubleshooting

### Parent sees only 1 trip

**Possible cause:** Only 1 schedule created for the day
**Solution:** Verify 10 schedules exist (5 morning + 5 afternoon)

```bash
mysql -u root -p smart_bus_tracking -e "
SELECT id, route_id, gio_bat_dau FROM Schedules WHERE ngay_chay = CURDATE();
"
```

### New student shows 0 trips

**Possible cause:** No schedules created after student creation
**Solution:** Check if schedules exist for routes 1 and 2

```bash
mysql -u root -p smart_bus_tracking -e "
SELECT COUNT(*) FROM Schedules WHERE route_id IN (1,2) AND ngay_chay >= CURDATE();
"
```

### API returns old single-column data

**Possible cause:** Code not reloaded after changes
**Solution:** Restart backend

```bash
# Kill running process
pkill -f "npm start"

# Restart
cd backend && npm start
```

### Test script fails with connection error

**Possible cause:** Backend not running
**Solution:**

```bash
# Check if backend is running
lsof -i :8080

# If not, start it
cd backend && npm start
```

---

## 📊 Expected Test Results

| Test                         | Expected     | Actual | ✅  |
| ---------------------------- | ------------ | ------ | --- |
| Students with dual columns   | 35           | ?      |     |
| ScheduleStudent records      | 70           | ?      |     |
| Parent sees 2 trips          | Yes          | ?      |     |
| Auto-assign works            | 7+ per route | ?      |     |
| Create student succeeds      | Yes          | ?      |     |
| Frontend displays both trips | Yes          | ?      |     |

---

## 🎯 Success Criteria

✅ **All tests pass when:**

1. Students have BOTH `default_route_stop_id_di` and `default_route_stop_id_ve`
2. Parent API returns 2 trips per child (morning + afternoon)
3. Auto-assign creates ScheduleStudent records for both directions
4. Frontend displays trip cards for both morning and afternoon
5. Total ScheduleStudent count = 70 (or 70+ with new students)

---

## 📝 Notes

- Use `CURDATE()` for today's date in queries
- Test credentials use parent_id = 7 for comprehensive testing
- All timestamps in HH:MM:SS format (06:00:00, 15:30:00, etc.)
- Test data includes 2 tuyến per route (morning + afternoon pairs)

---

## 🚀 Full Test Command

```bash
# All-in-one test script
node backend/test-dual-direction.js
```

This runs:

1. GET /api/students → Verify dual columns
2. GET /api/schedules/parent/my-kids-trip → Verify 2 trips
3. POST /api/students/with-parent → Create new student
4. Summary of expected data counts

---

Enjoy! 🎉
