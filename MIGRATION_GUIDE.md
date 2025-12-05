# Database Migration Guide - Step by Step

## ✅ Files Updated

### 1. `smart_bus_tracking.sql`

- **Status:** ✅ Modified (schema with 2 new columns)
- **Location:** `CNPM_SSB1.0/database/smart_bus_tracking.sql`
- **Changes:** Added `default_route_stop_id_di` and `default_route_stop_id_ve` to Students table

### 2. `seed.sql`

- **Status:** ✅ Completely Rewritten
- **Location:** `CNPM_SSB1.0/database/seed.sql`
- **Changes:**
  - Rewrote with 10 routes (5 tuyến × 2 chiều)
  - 35 students each with dual-direction assignment
  - 10 schedules for today
  - 70 ScheduleStudent records (35 students × 2 schedules)

---

## 🔄 MIGRATION STEPS (Choose One)

### Option A: Command Line (RECOMMENDED)

```bash
# Step 1: Navigate to database folder
cd "c:\Users\LENOVO-PC\Desktop\CNPM\CNPM_SSB1.0\database"

# Step 2: Backup current database (IMPORTANT!)
mysqldump -u root -p12345 smart_bus_tracking > backup_$(date +%Y%m%d_%H%M%S).sql

# Step 3: Drop old database
mysql -u root -p12345 -e "DROP DATABASE IF EXISTS smart_bus_tracking;"

# Step 4: Create new database and import schema
mysql -u root -p12345 < smart_bus_tracking.sql

# Step 5: Import seed data
mysql -u root -p12345 smart_bus_tracking < seed.sql

# Step 6: Verify import succeeded
mysql -u root -p12345 -e "USE smart_bus_tracking; SHOW TABLES; SELECT COUNT(*) as total_students FROM Students;"
```

---

### Option B: MySQL Workbench UI

#### Step 1: Backup Current Data

1. Open MySQL Workbench
2. Connect to localhost:3306
3. Right-click `smart_bus_tracking` database
4. Select "Dump SQL File..."
5. Save to `backup_YYYYMMDD.sql`

#### Step 2: Drop Database

1. Right-click `smart_bus_tracking` database
2. Select "Drop Schema..."
3. Check "Drop Now"
4. Click "Execute"

#### Step 3: Create New Schema

1. File → Open SQL Script
2. Select `smart_bus_tracking.sql`
3. Click Execute (lightning icon)
4. Wait for completion

#### Step 4: Import Seed Data

1. File → Open SQL Script
2. Select `seed.sql`
3. Click Execute (lightning icon)
4. Wait for completion

#### Step 5: Verify

```sql
SELECT COUNT(*) as Routes FROM Routes;
SELECT COUNT(*) as Students FROM Students;
SELECT COUNT(*) as Schedules FROM Schedules;
SELECT COUNT(*) as ScheduleStudents FROM ScheduleStudents;
```

---

### Option C: Node.js Backend (If Using Custom Script)

```javascript
// In your backend initialization:
const mysql = require("mysql2/promise");

async function migrateDatabase() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "12345",
  });

  try {
    // Drop old database
    await connection.query("DROP DATABASE IF EXISTS smart_bus_tracking");
    console.log("✅ Old database dropped");

    // Create new one
    await connection.query("CREATE DATABASE smart_bus_tracking");
    await connection.query("USE smart_bus_tracking");
    console.log("✅ New database created");

    // Execute schema
    const schemaSQL = require("fs").readFileSync(
      "database/smart_bus_tracking.sql",
      "utf8"
    );
    await connection.query(schemaSQL);
    console.log("✅ Schema created");

    // Execute seed data
    const seedSQL = require("fs").readFileSync("database/seed.sql", "utf8");
    await connection.query(seedSQL);
    console.log("✅ Seed data imported");

    // Verify
    const [students] = await connection.query(
      "SELECT COUNT(*) as count FROM Students"
    );
    console.log(`✅ Migration complete! Total students: ${students[0].count}`);
  } finally {
    await connection.end();
  }
}

// Call on server start
migrateDatabase().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
```

---

## ✓ Verification Checklist

After migration, run these checks:

### 1. Table Structure

```sql
-- Check Students table has new columns
DESCRIBE Students;
-- Should show: default_route_stop_id_di, default_route_stop_id_ve
```

### 2. Data Counts

```sql
-- Verify all data imported
SELECT
  (SELECT COUNT(*) FROM Users) as users,
  (SELECT COUNT(*) FROM Buses) as buses,
  (SELECT COUNT(*) FROM Stops) as stops,
  (SELECT COUNT(*) FROM Routes) as routes,
  (SELECT COUNT(*) FROM RouteStops) as routestops,
  (SELECT COUNT(*) FROM Students) as students,
  (SELECT COUNT(*) FROM Schedules) as schedules,
  (SELECT COUNT(*) FROM ScheduleStudents) as schedule_students;

-- Expected output:
-- | users | buses | stops | routes | routestops | students | schedules | schedule_students |
-- |   46  |   5   |  16   |   10   |     40     |    35    |    10     |        70        |
```

### 3. Parent Data

```sql
-- Check a parent can see both child schedules
SELECT ss.schedule_id, s.id as student_id, s.ho_ten, u.ho_ten as parent,
       r.ten_tuyen, sch.gio_bat_dau
FROM Students s
JOIN ScheduleStudents ss ON s.id = ss.student_id
JOIN Schedules sch ON ss.schedule_id = sch.id
JOIN Routes r ON sch.route_id = r.id
JOIN Users u ON s.parent_id = u.id
WHERE s.ho_ten = 'Nguyễn Văn Tèo'
ORDER BY sch.gio_bat_dau;

-- Expected: 2 rows (morning + afternoon)
```

### 4. Driver Data

```sql
-- Check a driver has both morning/afternoon schedules
SELECT s.id, r.ten_tuyen, r.loai_tuyen, s.gio_bat_dau, COUNT(ss.id) as students
FROM Schedules s
JOIN Routes r ON s.route_id = r.id
LEFT JOIN ScheduleStudents ss ON s.id = ss.schedule_id
WHERE s.driver_id = 2  -- Driver taixe1
GROUP BY s.id
ORDER BY s.gio_bat_dau;

-- Expected: 2 rows (Routes 1 & 2 at 6:00am and 3:30pm)
```

### 5. Student Dual Assignment

```sql
-- Check all students have both directions
SELECT s.id, s.ho_ten,
       ddi.id as pickup_routestop_id, ddi.gio_don_du_kien as pickup_time,
       dve.id as dropoff_routestop_id, dve.gio_don_du_kien as dropoff_time
FROM Students s
LEFT JOIN RouteStops ddi ON s.default_route_stop_id_di = ddi.id
LEFT JOIN RouteStops dve ON s.default_route_stop_id_ve = dve.id
ORDER BY s.id;

-- Expected: 35 rows, all with both pickup and dropoff IDs populated
```

---

## 🚨 Troubleshooting

### Error: "Foreign key constraint fails"

**Cause:** Schema changes referenced columns that don't exist
**Solution:** Make sure you ran `smart_bus_tracking.sql` FIRST before `seed.sql`

### Error: "Duplicate entry"

**Cause:** Database wasn't fully dropped
**Solution:**

```sql
DROP DATABASE IF EXISTS smart_bus_tracking;
```

### Error: "File not found"

**Cause:** Working directory is wrong
**Solution:** Make sure you're in `database/` folder:

```bash
cd CNPM_SSB1.0/database
```

### Students show only 1 schedule

**Cause:** Backend query not updated for new schema
**Solution:** Backend needs update to check BOTH columns:

- Old: `WHERE default_route_stop_id = ...`
- New: `WHERE default_route_stop_id_di = ... OR default_route_stop_id_ve = ...`

### Schedules don't appear in parent dashboard

**Cause:** API still using old Students.default_route_stop_id
**Solution:** Update backend service to use new column names

---

## 📋 Post-Migration Tasks

### 1. Update Backend Code

Files to check/update:

- `backend/src/services/schedule.service.js` - Auto-assign logic
- `backend/src/api/*/routes.js` - API endpoints
- `backend/src/utils/queries.js` - SQL queries

### 2. Test All Flows

- [ ] Parent login - see 2 schedules per child
- [ ] Driver login - see morning + afternoon
- [ ] Admin dashboard - show all 10 schedules
- [ ] Create new schedule - auto-assign works

### 3. Update Documentation

- [ ] Update API documentation
- [ ] Update database schema diagram
- [ ] Update testing guides

### 4. Production Checklist

- [ ] Test on staging first
- [ ] Have rollback backup ready
- [ ] Schedule migration during low-traffic time
- [ ] Monitor after migration
- [ ] Keep old backup for 30+ days

---

## 📊 Data Rollback (If Needed)

```bash
# If migration fails, restore backup:
mysql -u root -p12345 < backup_YYYYMMDD_HHMMSS.sql

# Then restart backend to reload from DB
```

---

## 🎯 Success Indicators

✅ All indicators should be true:

- [ ] 46 users created (1 admin, 5 drivers, 40 parents)
- [ ] 35 students created with both pickup/dropoff assignments
- [ ] 10 routes created (5 tuyến × 2 directions)
- [ ] 10 schedules created for today
- [ ] 70 ScheduleStudent assignments created
- [ ] Parent (ph1) sees 2 schedules for child
- [ ] Driver (taixe1) sees 2 schedules for today
- [ ] No foreign key constraint errors
- [ ] No duplicate entry errors

---

## 📞 Quick Help

**Need to verify just the Students table?**

```sql
SELECT * FROM Students LIMIT 5;
```

**Need to see today's schedules?**

```sql
SELECT * FROM Schedules WHERE ngay_chay = CURDATE() ORDER BY gio_bat_dau;
```

**Need to rollback?**

```bash
mysql -u root -p12345 smart_bus_tracking < backup_DATE.sql
```

---

**Created:** December 5, 2025
**Last Updated:** December 5, 2025
**Status:** ✅ Ready for Migration
