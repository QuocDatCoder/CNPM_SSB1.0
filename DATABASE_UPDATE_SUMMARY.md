# Database Schema & Seed Data Update Summary

## ✅ Completed Tasks

### 1. Modified `smart_bus_tracking.sql` Schema

**File:** `database/smart_bus_tracking.sql`

**Changes Made:**

- Updated `Students` table to support dual-direction routes
- **Old:** Single column `default_route_stop_id` (one route only)
- **New:** Two columns for pickup/dropoff:
  - `default_route_stop_id_di` - RouteStop for lượt đi (morning pickup)
  - `default_route_stop_id_ve` - RouteStop for lượt về (afternoon dropoff)

```sql
CREATE TABLE `Students` (
  ...
  `default_route_stop_id_di` INT DEFAULT NULL COMMENT 'Điểm dừng lượt đi',
  `default_route_stop_id_ve` INT DEFAULT NULL COMMENT 'Điểm dừng lượt về',
  FOREIGN KEY (`default_route_stop_id_di`) REFERENCES `RouteStops`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`default_route_stop_id_ve`) REFERENCES `RouteStops`(`id`) ON DELETE SET NULL
)
```

### 2. Completely Rewrote `seed.sql` with Dual-Direction Support

**File:** `database/seed.sql`

**New Data Structure:**

#### Users (46 total)

- 1 Admin (`admin@school.com`)
- 5 Drivers: taixe1-5 (driver_code 1001-1005)
- 40 Parents: ph1-ph40 (parent_code 2001-2040)

#### Buses (5 total)

- All buses marked as 'Ngừng' (inactive for initial testing)

#### Stops (16 total)

- School as central hub (ID 1: Trường Quốc Tế ABC)
- 15 pickup/dropoff points distributed across HCM districts

#### Routes (10 total - 5 Tuyến × 2 Chiều)

```
Route 1: Tuyến 1 Lượt Đi (Nhà Bè → School, 6:00am start)
Route 2: Tuyến 1 Lượt Về (School → Nhà Bè, 3:30pm start)
Route 3: Tuyến 2 Lượt Đi (Phú Mỹ Hưng → School, 6:15am)
Route 4: Tuyến 2 Lượt Về (School → Phú Mỹ Hưng, 3:45pm)
Route 5: Tuyến 3 Lượt Đi (Bình Thạnh → School, 5:45am)
Route 6: Tuyến 3 Lượt Về (School → Bình Thạnh, 3:30pm)
Route 7: Tuyến 4 Lượt Đi (Quận 4 → School, 6:00am)
Route 8: Tuyến 4 Lượt Về (School → Quận 4, 3:30pm)
Route 9: Tuyến 5 Lượt Đi (Trung Sơn → School, 6:00am)
Route 10: Tuyến 5 Lượt Về (School → Trung Sơn, 3:40pm)
```

#### RouteStops (40 total)

- Each route has 4 stops (3-4 pickup/dropoff points + school as destination)
- Going routes (lượt_di): Pickup sequence → School
- Returning routes (lượt_về): School → Reverse dropoff sequence

#### Students (35 total - 7 per Tuyến)

**IMPORTANT:** Each student now has BOTH directions assigned:

- `default_route_stop_id_di` - Morning pickup location
- `default_route_stop_id_ve` - Afternoon dropoff location

Example: Nguyễn Văn Tèo (ID 1)

- RouteStop DI (ID 1): Stop 5 on Route 1 (pickup morning)
- RouteStop VỀ (ID 14): Stop 14 on Route 2 (dropoff afternoon)

**Distribution by Tuyến:**

- Tuyến 1: Students 1-7
- Tuyến 2: Students 8-14
- Tuyến 3: Students 15-21
- Tuyến 4: Students 22-28
- Tuyến 5: Students 29-35

#### Schedules (10 total - for today/CURDATE())

```
Schedule 1: Route 1 (Lượt Đi), Driver 2, Bus 1, 6:00am
Schedule 2: Route 2 (Lượt Về), Driver 2, Bus 1, 3:30pm
Schedule 3: Route 3 (Lượt Đi), Driver 3, Bus 2, 6:15am
Schedule 4: Route 4 (Lượt Về), Driver 3, Bus 2, 3:45pm
Schedule 5: Route 5 (Lượt Đi), Driver 4, Bus 3, 5:45am
Schedule 6: Route 6 (Lượt Về), Driver 4, Bus 3, 3:30pm
Schedule 7: Route 7 (Lượt Đi), Driver 5, Bus 4, 6:00am
Schedule 8: Route 8 (Lượt Về), Driver 5, Bus 4, 3:30pm
Schedule 9: Route 9 (Lượt Đi), Driver NULL, Bus 5, 6:00am
Schedule 10: Route 10 (Lượt Về), Driver NULL, Bus 5, 3:40pm
```

**Key Point:** Same driver/bus runs both directions (e.g., Driver 2 operates Routes 1→2 same day)

#### ScheduleStudents (70 total)

- Each student appears on EXACTLY 2 schedules (lượt_đi + lượt_về)
- Total: 35 students × 2 schedules = 70 records

---

## 🔄 Database Migration Steps

To apply these changes to your running database:

```bash
# 1. Backup current database
mysqldump -u root -p12345 smart_bus_tracking > backup_$(date +%Y%m%d).sql

# 2. Drop existing database
mysql -u root -p12345 -e "DROP DATABASE smart_bus_tracking;"

# 3. Create new schema
mysql -u root -p12345 < smart_bus_tracking.sql

# 4. Import new seed data
mysql -u root -p12345 < seed.sql

# 5. Verify data was imported
mysql -u root -p12345 -e "USE smart_bus_tracking; SELECT COUNT(*) as Students FROM Students; SELECT COUNT(*) as Schedules FROM Schedules; SELECT COUNT(*) as ScheduleStudents FROM ScheduleStudents;"
```

---

## 📊 Expected Data Counts After Import

| Table            | Count | Notes                               |
| ---------------- | ----- | ----------------------------------- |
| Users            | 46    | 1 admin + 5 drivers + 40 parents    |
| Buses            | 5     | All status 'Ngừng'                  |
| Stops            | 16    | 1 school + 15 pickup/dropoff points |
| Routes           | 10    | 5 tuyến × 2 chiều                   |
| RouteStops       | 40    | 4 per route                         |
| Students         | 35    | 7 per tuyến                         |
| Schedules        | 10    | For today (CURDATE)                 |
| ScheduleStudents | 70    | 35 students × 2 schedules each      |
| LocationHistory  | 0     | Empty                               |
| Notifications    | 0     | Empty                               |

---

## 🎯 Key Features of New Data Model

### 1. **Dual Direction Support**

- Students can have different pickup/dropoff locations
- Example: Pickup from Sunrise City (Route 1 DI), dropoff at different location (Route 1 VỀ)

### 2. **Flexible Driver/Bus Assignment**

- Same driver can operate both directions same day
- Driver/bus can be NULL initially (assigned later)

### 3. **Complete Test Coverage**

- 35 students across 5 routes
- Each route has dedicated driver + bus
- Both morning and afternoon schedules included
- Data ready for parent dashboard, driver app, and admin testing

### 4. **Realistic Schedule Times**

- Morning: 5:45am - 7:00am (various start times per route)
- Afternoon: 3:30pm - 4:35pm (dropoff times)
- Pickup time differences simulate realistic bus schedules

---

## ⚠️ Important Notes

1. **User IDs Start at 2:** User ID 1 is admin. Drivers/Parents start from ID 2 onwards.

2. **Driver/Parent Relationship:**

   - Students are linked to parents via `parent_id`
   - Use parent_code (2001-2040) to distinguish parents in UI

3. **RouteStop IDs:**

   - Students are assigned specific RouteStop records (not just Stop records)
   - This ensures they're linked to specific routes and order/timing

4. **Testing Recommendations:**
   - Login as ph1 (parent): Should see 2 schedules for child (morning + afternoon)
   - Login as taixe1: Should see 2 schedules (Routes 1 & 2 both with bus 1)
   - Check admin panel: Should show 35 students across 5 routes

---

## ✨ Next Steps

1. **Backend Update:** Update auto-assign logic to handle both `default_route_stop_id_di` and `default_route_stop_id_ve`
2. **Frontend Testing:** Parent dashboard should now show 2 trips per child
3. **Driver App:** Should display both morning and afternoon schedules
4. **Database Queries:** Verify your existing queries still work with new column names

---

**Created:** December 5, 2025
**Schema Version:** Dual Direction Support v1.0
**Compatibility:** MySQL 5.7+
