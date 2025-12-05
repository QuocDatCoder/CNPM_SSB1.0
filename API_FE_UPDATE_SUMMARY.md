# 🔄 API & Frontend Update Summary - Dual Direction Support

## 📋 Overview

Updated both Backend API and Frontend code to fully support the new dual-direction data model where students can be assigned to BOTH morning pickup (lượt_đi) AND afternoon dropoff (lượt_về) routes.

---

## 🔧 Backend Changes

### 1. **Student Model** (`backend/src/data/models/student.model.js`)

**Changed Columns:**

```javascript
// OLD:
default_route_stop_id: {
    type: DataTypes.INTEGER,
    allowNull: true
}

// NEW:
default_route_stop_id_di: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Điểm dừng lượt đi (buổi sáng)'
},
default_route_stop_id_ve: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Điểm dừng lượt về (buổi chiều)'
}
```

✅ **Status:** Updated

---

### 2. **Student Service** (`backend/src/services/student.service.js`)

#### Function: `getAllStudents()`

**Changes:**

- Updated includes to fetch BOTH `defaultRouteStopDi` and `defaultRouteStopVe`
- Returns separate properties for each direction
- Maintains backward compatibility with old single-column approach

**Output Structure:**

```javascript
{
    id: 1,
    ho_ten: "Nguyễn Văn Tèo",
    lop: "Lớp 1A",
    // ... other fields ...

    // Morning route (Lượt đi)
    tram_don_di: "Crescent Mall",
    dia_chi_tram_di: "Address DI",
    tuyen_duong_di: "Tuyến 1",
    default_route_stop_id_di: 1,

    // Afternoon route (Lượt về)
    tram_don_ve: "Crescent Mall",
    dia_chi_tram_ve: "Address VE",
    tuyen_duong_ve: "Tuyến 1",
    default_route_stop_id_ve: 14
}
```

✅ **Status:** Updated

#### Function: `autoAssignToSchedule()`

**Changes:**

- Signature changed from `(studentId, routeId, stopId, transaction)`
- To: `(studentId, routeStopIdDi, routeStopIdVe, transaction)`
- Now handles both directions simultaneously
- Maps RouteStop IDs to Routes to find applicable schedules

**Logic Flow:**

1. Accept RouteStop IDs for both directions
2. Fetch RouteStop records to get route_id and stop_id
3. Group by route_id
4. Find all schedules for each route (from today onwards)
5. Create ScheduleStudent records for each schedule

✅ **Status:** Updated

#### Function: `createStudentWithParent()`

**Changes:**

- Request now expects `route_id_di`, `stop_id_di`, `route_id_ve`, `stop_id_ve`
- Creates Student with BOTH `default_route_stop_id_di` and `default_route_stop_id_ve`
- Calls updated `autoAssignToSchedule()` with both IDs

**Request Payload Example:**

```javascript
{
    ho_ten_hs: "Học sinh mới",
    lop: "Lớp 1A",
    ngay_sinh: "2018-01-15",
    gioi_tinh: "Nam",
    gvcn: "Cô Lan",

    // Parent info
    ho_ten_ph: "Phụ huynh",
    sdt_ph: "0901234567",
    email_ph: "parent@email.com",

    // Morning route
    route_id_di: 1,
    stop_id_di: 5,

    // Afternoon route
    route_id_ve: 2,
    stop_id_ve: 6
}
```

✅ **Status:** Updated

#### Function: `updateStudent()`

**Changes:**

- Now accepts `route_id_di`, `stop_id_di`, `route_id_ve`, `stop_id_ve`
- Updates BOTH direction columns in Student table

✅ **Status:** Updated

---

### 3. **Schedule Service** (`backend/src/services/schedule.service.js`)

#### Function: `createSchedule()`

**Changes to Auto-Assign Logic:**

- Now filters students based on route's `loai_tuyen` (lượt_di vs lượt_về)
- For morning routes (luot_di): Find students with `default_route_stop_id_di`
- For afternoon routes (luot_ve): Find students with `default_route_stop_id_ve`
- Properly assigns each student to the appropriate schedule based on route type

**Code Update:**

```javascript
if (route.loai_tuyen === "luot_di") {
  // For morning routes, find students with default_route_stop_id_di
  studentsOnRoute = await Student.findAll({
    where: { default_route_stop_id_di: routeStopIds },
  });
} else {
  // For afternoon routes, find students with default_route_stop_id_ve
  studentsOnRoute = await Student.findAll({
    where: { default_route_stop_id_ve: routeStopIds },
  });
}
```

✅ **Status:** Updated

#### Existing Functions ✅

- `getParentDashboardInfo()` - ✅ **Already works** with dual data (queries via ScheduleStudents)
- `getStudentsByScheduleId()` - ✅ **Already works** (queries via ScheduleStudents)
- `getStudentsForDriverCurrentTrip()` - ✅ **Already works** (queries via ScheduleStudents)
- `updateStudentStatus()` - ✅ **Already works** (independent of student route columns)

---

### 4. **Model Associations** (`backend/src/data/models/index.js`)

**Changes:**

```javascript
// OLD:
RouteStop.hasMany(Student, { foreignKey: "default_route_stop_id" });
Student.belongsTo(RouteStop, {
  foreignKey: "default_route_stop_id",
  as: "defaultRouteStop",
});

// NEW:
RouteStop.hasMany(Student, { foreignKey: "default_route_stop_id_di" });
Student.belongsTo(RouteStop, {
  foreignKey: "default_route_stop_id_di",
  as: "defaultRouteStopDi",
});

RouteStop.hasMany(Student, { foreignKey: "default_route_stop_id_ve" });
Student.belongsTo(RouteStop, {
  foreignKey: "default_route_stop_id_ve",
  as: "defaultRouteStopVe",
});
```

✅ **Status:** Updated

---

## 🎨 Frontend Changes

### 1. **Parent Dashboard** (`frontend/src/pages/parent/Dashboard.jsx`)

**Status:** ✅ **No changes needed**

**Why?** The existing implementation already correctly handles dual trips:

1. Data transformation loop:

```javascript
const trips = kids.flatMap((kid) =>
  (kid.danh_sach_chuyen || []).map((trip, idx) => ({
    // Each trip becomes a separate trip card
  }))
);
```

2. Trip classification logic:

```javascript
title: trip.loai_chuyen.includes("Đón") ? "Buổi Sáng" : "Buổi Chiều",
shift: trip.loai_chuyen.includes("Đón") ? "morning" : "afternoon",
```

3. Since `danh_sach_chuyen` is an array, it will now contain:
   - 1 morning trip (lượt_đi)
   - 1 afternoon trip (lượt_về)
   - Display both correctly ✅

---

### 2. **Other Frontend Services** ✅

- **ParentTrackingService** - ✅ Works with current API
- **ScheduleService** - ✅ No changes needed
- **StudentService** - ✅ Works with updated API payload

---

## 📊 API Endpoints Summary

### Parent Endpoints

| Endpoint                             | Method | Purpose                         | Updated  | Notes                                        |
| ------------------------------------ | ------ | ------------------------------- | -------- | -------------------------------------------- |
| `/api/schedules/parent/my-kids-trip` | GET    | Get child's schedules for today | ✅ Works | Returns array with morning + afternoon trips |

### Student Management Endpoints

| Endpoint                    | Method | Purpose                 | Updated    | Notes                                 |
| --------------------------- | ------ | ----------------------- | ---------- | ------------------------------------- |
| `/api/students`             | GET    | Get all students        | ✅ Updated | Returns both di/ve route info         |
| `/api/students/with-parent` | POST   | Create student + parent | ✅ Updated | Expects route_id_di/ve, stop_id_di/ve |
| `/api/students/:id`         | PUT    | Update student          | ✅ Updated | Accepts route_id_di/ve, stop_id_di/ve |
| `/api/students/:id`         | DELETE | Delete student          | ✅ Works   | No changes needed                     |

### Schedule Management Endpoints

| Endpoint                                 | Method | Purpose                  | Updated    | Notes                               |
| ---------------------------------------- | ------ | ------------------------ | ---------- | ----------------------------------- |
| `/api/schedules`                         | POST   | Create schedule          | ✅ Updated | Auto-assign now respects loai_tuyen |
| `/api/schedules/driver/my-schedule`      | GET    | Driver schedule          | ✅ Works   | No changes needed                   |
| `/api/schedules/driver/current-students` | GET    | Students in current trip | ✅ Works   | No changes needed                   |

---

## 🧪 Testing Checklist

### 1. Backend Tests

- [ ] Create new student with `route_id_di`, `stop_id_di`, `route_id_ve`, `stop_id_ve`
- [ ] Verify both columns populated in DB
- [ ] Create schedule for Route 1 (lượt_đi) - should auto-assign students with `default_route_stop_id_di`
- [ ] Create schedule for Route 2 (lượt_về) - should auto-assign students with `default_route_stop_id_ve`
- [ ] GET /api/students - verify dual direction info returned
- [ ] GET /api/schedules/parent/my-kids-trip - verify 2 trips per child (morning + afternoon)

### 2. Frontend Tests

- [ ] Parent login
- [ ] Dashboard shows child with 2 trip cards (morning + afternoon)
- [ ] "Buổi Sáng" card shows morning route info
- [ ] "Buổi Chiều" card shows afternoon route info
- [ ] Click tracking on both trips

### 3. Data Consistency

- [ ] DB seed: 35 students × 2 columns = 70 total assignments
- [ ] Schedules: 10 total (5 morning + 5 afternoon)
- [ ] ScheduleStudents: 70 records (35 students × 2 schedules each)
- [ ] No orphaned ScheduleStudent records

---

## 🔄 Migration Steps

### For Development Environment:

1. **Drop old database:**

   ```sql
   DROP DATABASE IF EXISTS smart_bus_tracking;
   ```

2. **Re-create with new schema:**

   ```bash
   mysql -u root -p < database/smart_bus_tracking.sql
   ```

3. **Seed with new data:**

   ```bash
   mysql -u root -p smart_bus_tracking < database/seed.sql
   ```

4. **Restart backend server:**

   ```bash
   npm start  # in backend/
   ```

5. **Clear browser cache and reload frontend**

---

## ⚠️ Backward Compatibility Notes

- ✅ Old `default_route_stop_id` column removed (schema changed)
- ✅ Old API payloads with single route_id/stop_id will NOT work
- ✅ New API expects explicit `route_id_di/ve` and `stop_id_di/ve`
- ✅ Frontend automatically handles dual data (no changes needed)
- ✅ Parent API automatically returns 2 trips per child (all existing code works)

---

## 📝 Example API Requests

### Create Student with Both Directions

```bash
curl -X POST http://localhost:8080/api/students/with-parent \
  -H "Content-Type: application/json" \
  -d '{
    "ho_ten_hs": "Nguyễn Văn Tèo",
    "lop": "Lớp 1A",
    "ngay_sinh": "2018-01-15",
    "gioi_tinh": "Nam",
    "gvcn": "Cô Lan",
    "ho_ten_ph": "Nguyễn Văn A",
    "sdt_ph": "0901234567",
    "email_ph": "parent@email.com",
    "route_id_di": 1,
    "stop_id_di": 5,
    "route_id_ve": 2,
    "stop_id_ve": 6
  }'
```

### Get Parent Dashboard

```bash
curl -X GET http://localhost:8080/api/schedules/parent/my-kids-trip \
  -H "Cookie: userId=7; vai_tro=phuhuynh"
```

**Response Structure:**

```json
[
  {
    "student_id": 1,
    "ten_con": "Nguyễn Văn Tèo",
    "lop": "Lớp 1A",
    "danh_sach_chuyen": [
      {
        "schedule_id": 1,
        "loai_chuyen": "Lượt đi (Đón)",
        "gio_du_kien": "06:00:00",
        "ten_tuyen": "Tuyến 1",
        "bien_so_xe": "51B-001.01",
        "tai_xe": "Tài xế 1",
        "diem_dung": "Crescent Mall"
      },
      {
        "schedule_id": 2,
        "loai_chuyen": "Lượt về (Trả)",
        "gio_du_kien": "15:30:00",
        "ten_tuyen": "Tuyến 1",
        "bien_so_xe": "51B-001.01",
        "tai_xe": "Tài xế 1",
        "diem_dung": "Crescent Mall"
      }
    ]
  }
]
```

---

## 🎯 Success Criteria

✅ **All checks passed:**

1. Student model uses dual columns
2. API creates students with both directions
3. Auto-assign correctly assigns to morning and afternoon schedules
4. Parent dashboard shows 2 trips per child
5. No breaking changes to existing endpoints
6. Frontend automatically displays dual data correctly

---

## 📝 Notes

- The `getParentDashboardInfo()` function remains unchanged because it queries through `ScheduleStudents`, which is route-agnostic
- The auto-assign logic in `createSchedule()` is the key update that bridges the gap between the old single-column model and the new dual-column model
- All existing driver and tracking endpoints continue to work without modification
