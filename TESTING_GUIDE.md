# Quick Reference: Dual Direction Data Model

## Database Schema Changes

### Students Table - NEW COLUMNS

```sql
`default_route_stop_id_di` INT  -- Morning pickup point (lượt đi)
`default_route_stop_id_ve` INT  -- Afternoon dropoff point (lượt về)
```

## Test Data Overview

### Routes & Schedules (For Today/CURDATE)

```
SCHEDULE 1 & 2 (Tuyến 1)
  Route 1 (Lượt Đi):  6:00am - Driver 2, Bus 1
  Route 2 (Lượt Về):  3:30pm - Driver 2, Bus 1  [SAME DRIVER/BUS]

SCHEDULE 3 & 4 (Tuyến 2)
  Route 3 (Lượt Đi):  6:15am - Driver 3, Bus 2
  Route 4 (Lượt Về):  3:45pm - Driver 3, Bus 2

SCHEDULE 5 & 6 (Tuyến 3)
  Route 5 (Lượt Đi):  5:45am - Driver 4, Bus 3
  Route 6 (Lượt Về):  3:30pm - Driver 4, Bus 3

SCHEDULE 7 & 8 (Tuyến 4)
  Route 7 (Lượt Đi):  6:00am - Driver 5, Bus 4
  Route 8 (Lượt Về):  3:30pm - Driver 5, Bus 4

SCHEDULE 9 & 10 (Tuyến 5)
  Route 9 (Lượt Đi):  6:00am - Driver NULL, Bus 5
  Route 10 (Lượt Về): 3:40pm - Driver NULL, Bus 5
```

### Student Distribution

```
Students 1-7:   Tuyến 1 (Parent IDs 7-13)
Students 8-14:  Tuyến 2 (Parent IDs 14-20)
Students 15-21: Tuyến 3 (Parent IDs 21-27)
Students 22-28: Tuyến 4 (Parent IDs 28-34)
Students 29-35: Tuyến 5 (Parent IDs 35-41)
```

## Login Credentials (For Testing)

### Admin

- Username: `admin`
- Password: `123456`
- Email: `admin@school.com`

### Parents (Sample)

- Username: `ph1` - `ph40`
- Password: `123456` (all same)
- Parent Code: `2001` - `2040`
- **Test User:** ph1 (has child Nguyễn Văn Tèo with both schedules)

### Drivers (Sample)

- Username: `taixe1` - `taixe5`
- Password: `123456` (all same)
- Driver Code: `1001` - `1005`
- **Test User:** taixe1 (operates Routes 1 & 2, both with Bus 1)

## Parent Dashboard Test

**Login:** ph1 / 123456

**Expected Result:**

- See child: "Nguyễn Văn Tèo" (Student ID 1)
- Should see 2 schedules:
  1. **Morning (Lượt Đi):** Route 1, 6:00am, Bus 1 (driven by taixe1)
  2. **Afternoon (Lượt Về):** Route 2, 3:30pm, Bus 1 (driven by taixe1)

## Driver Dashboard Test

**Login:** taixe1 / 123456

**Expected Result:**

- See 2 schedules for today:
  1. **6:00am** - Route 1 (Tuyến 1 Lượt Đi), Bus 1, 7 students
  2. **3:30pm** - Route 2 (Tuyến 1 Lượt Về), Bus 1, 7 students

## Database Verification Queries

### Check Students with Both Directions

```sql
SELECT s.id, s.ho_ten,
       ddi.id as routestop_di_id, ddi.gio_don_du_kien as pickup_time,
       dve.id as routestop_ve_id, dve.gio_don_du_kien as dropoff_time
FROM Students s
LEFT JOIN RouteStops ddi ON s.default_route_stop_id_di = ddi.id
LEFT JOIN RouteStops dve ON s.default_route_stop_id_ve = dve.id
LIMIT 5;
```

### Check Schedules for Today

```sql
SELECT s.id, r.ten_tuyen, u.ho_ten as driver, b.bien_so_xe,
       s.ngay_chay, s.gio_bat_dau,
       COUNT(ss.id) as num_students
FROM Schedules s
JOIN Routes r ON s.route_id = r.id
LEFT JOIN Users u ON s.driver_id = u.id
LEFT JOIN Buses b ON s.bus_id = b.id
LEFT JOIN ScheduleStudents ss ON s.id = ss.schedule_id
WHERE s.ngay_chay = CURDATE()
GROUP BY s.id
ORDER BY s.gio_bat_dau;
```

### Count Data Summary

```sql
SELECT
  (SELECT COUNT(*) FROM Students) as total_students,
  (SELECT COUNT(*) FROM Routes) as total_routes,
  (SELECT COUNT(*) FROM Schedules WHERE ngay_chay = CURDATE()) as today_schedules,
  (SELECT COUNT(*) FROM ScheduleStudents) as schedule_student_assignments;
```

## Important RouteStop IDs Reference

### Tuyến 1 (Routes 1-2)

- RouteStop 1: Stop 5, 6:00am (lượt đi)
- RouteStop 2: Stop 14, 6:15am (lượt đi)
- RouteStop 3: Stop 2, 6:30am (lượt đi)
- RouteStop 4: Stop 1, 6:45am (lượt đi)
- RouteStop 14: Stop 5, 4:15pm (lượt về)

### Stops Reference

```
Stop 1:  Trường Quốc Tế ABC (School)
Stop 2:  Chung Cư Sunrise City
Stop 3:  Lotte Mart Quận 7
Stop 4:  Crescent Mall
Stop 5:  Chung Cư Hoàng Anh Gia Lai
...
Stop 16: AEON Mall Bình Tân
```

## API Endpoints (Example)

### Get Parent's Children Schedules

```
GET /api/schedules/parent/my-kids-trip
Headers: Cookie: userId=7; vai_tro=phuhuynh
```

Expected: Array with 2 schedules per child

### Get Driver's Schedules

```
GET /api/driver/schedule
Headers: Cookie: userId=2; vai_tro=taixe
```

Expected: 2 schedules for today (lượt đi + lượt về)

## Backup Command

```bash
mysqldump -u root -p12345 smart_bus_tracking > smart_bus_tracking_backup_$(date +%Y%m%d_%H%M%S).sql
```

## Restore Command

```bash
mysql -u root -p12345 smart_bus_tracking < smart_bus_tracking_backup_DATE_TIME.sql
```

---

**Last Updated:** December 5, 2025
**Data Model Version:** 2.0 (Dual Direction)
