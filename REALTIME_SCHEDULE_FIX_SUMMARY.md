# Real-time Schedule Update Fix - Complete Summary

## Problem Statement

Driver dashboard was requiring full page reload when admin performed these operations:

- ✅ Add new schedule
- ✅ Update schedule
- ✅ Delete schedule

These operations should trigger real-time WebSocket updates without requiring page reload.

## Root Causes Identified

### Issue 1: Date Format Inconsistency

**Location:** `schedule.service.js` - `updateSchedule()` function (line ~342)

**Problem:**

```javascript
date: updatedSchedule.ngay_chay.toISOString().split("T")[0];
```

When `ngay_chay` comes from database as a string (e.g., "2025-02-20"), calling `.toISOString()` on a string throws an error, preventing socket emission.

**Solution:** Add type checking and convert based on actual type:

```javascript
let dateStr = updatedSchedule.ngay_chay;
if (dateStr instanceof Date) {
  dateStr = dateStr.toISOString().split("T")[0];
} else if (typeof dateStr === "string" && dateStr.includes("T")) {
  dateStr = dateStr.split("T")[0];
}
```

### Issue 2: Missing Driver Assignment Logic

**Location:** `schedule.service.js` - `updateSchedule()` function (line ~322)

**Problem:** When admin updates schedule without changing driver, the `newDriverId` could be undefined if `data.driver_id` wasn't provided in the update request.

**Solution:** Default to current driver:

```javascript
const newDriverId = data.driver_id || schedule.driver_id;
```

## Changes Made

### 1. Backend - `schedule.service.js`

#### Fix 1: Handle Driver Reassignment Properly (Line 322-323)

```javascript
const oldDriverId = schedule.driver_id;
const newDriverId = data.driver_id || schedule.driver_id; // Default to current driver
```

**Impact:**

- When driver changes: Emit delete to old driver + update to new driver ✅
- When driver doesn't change: Emit update to current driver ✅

#### Fix 2: Normalize Date Format (Line 337-344)

```javascript
let dateStr = updatedSchedule.ngay_chay;
if (dateStr instanceof Date) {
  dateStr = dateStr.toISOString().split("T")[0];
} else if (typeof dateStr === "string" && dateStr.includes("T")) {
  dateStr = dateStr.split("T")[0];
}

const updateData = {
  // ... other fields
  date: dateStr, // Now safely formatted as YYYY-MM-DD
  // ...
};
```

**Impact:** Prevents errors when `ngay_chay` is a string instead of Date object

### 2. Frontend - `AdminLayout.jsx`

Added TestSchedule component to admin panel for real-time testing:

- Import `TestSchedule` component
- Add "Test Lịch trình" menu item and case

### 3. Frontend - `Sidebar.jsx`

Added "Test Lịch trình" menu option (divider was added for visual separation)

### 4. Frontend - New Test Component

Created `TestSchedule.jsx` to allow admin to:

- Test ADD schedule operation
- Test UPDATE schedule operation
- Test DELETE schedule operation
- Run all tests in sequence
- View real-time logs of operations

## Architecture Overview

### WebSocket Flow

```
Admin Dashboard (Schedule Management)
         ↓
         [CREATE/UPDATE/DELETE API]
         ↓
Backend (schedule.service.js)
         ↓
         [Fetch updated schedule details]
         ↓
         [Prepare socket event data]
         ↓
schedule.handler.js helpers
         ↓
         [notifyDriverNewSchedule,
          notifyDriverScheduleUpdate,
          notifyDriverScheduleDeleted]
         ↓
global.io.to(`driver-${driverId}`).emit()
         ↓
Driver Browser (useDriverScheduleSocket hook)
         ↓
         [Receive socket event]
         ↓
Callbacks in Assignments.jsx
         ↓
State Update (setScheduleData)
         ↓
✅ Real-time UI Update (NO PAGE RELOAD)
```

### Data Flow for Update Operation

```javascript
// Backend sends this data structure:
{
  success: true,
  message: "...",
  data: {
    id: 123,
    date: "2025-02-20",              // YYYY-MM-DD format
    time: "08:00:00",                // HH:MM:SS
    route: "Tuyến A",
    type: "luot_di",                 // Route type
    bus: "ABC-123",
    startLocation: "Điểm A",
    endLocation: "Điểm B",
    title: "Lượt đi"
  },
  timestamp: "2025-02-14T10:30:00Z"
}

// Frontend normalizes and processes:
const normalizedSchedule = {
  id: 123,
  type: schedule.type === "luot_di" ? "morning" : "afternoon",
  title: "Lượt đi",
  time: "08:00",                     // 5 characters
  route: "Tuyến A",
  startLocation: "Điểm A",
  endLocation: "Điểm B",
  status: "chuabatdau"
}

// Stores by date key:
scheduleData["2025-02-20"] = [normalizedSchedule, ...]
```

## Testing Instructions

### Setup

1. **Start Backend:**

   ```bash
   cd CNPM_SSB1.0/backend
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd CNPM_SSB1.0/frontend
   npm run dev
   ```

### Manual Testing

#### Option 1: Using Test Component

1. Login as Admin (vai_tro: "admin")
2. Click "Test Lịch trình" in sidebar
3. Click "Run ALL Tests" button
4. Open Driver Dashboard in another tab (vai_tro: "taixe", driver_id: 2)
5. Observe real-time updates without page reload

#### Option 2: Using Schedule Management Page

1. Login as Admin
2. Go to "Lịch trình" (Schedule Management)
3. Add/Update/Delete schedules
4. In another tab, open Driver Dashboard as Driver 2
5. Verify changes appear in real-time

### Verification Checklist

- [ ] Add schedule: Appears on driver dashboard in real-time
- [ ] Update schedule: Driver sees changes without reload
- [ ] Delete schedule: Schedule disappears without reload
- [ ] Driver reassignment: Old driver sees deletion, new driver sees addition
- [ ] Console shows no WebSocket errors (F12)
- [ ] Backend logs show socket event emissions

## Files Modified

1. **Backend:**

   - `src/services/schedule.service.js` - Lines 322-390 (updateSchedule function)

2. **Frontend:**

   - `src/layouts/AdminLayout.jsx` - Import + route case
   - `src/components/common/Sidebar/Sidebar.jsx` - Menu item
   - `src/pages/admin/TestSchedule.jsx` - NEW test component

3. **Already Working (No Changes Needed):**
   - `src/hooks/useDriverScheduleSocket.js` - Socket listener hook ✅
   - `src/pages/driver/Assignments.jsx` - Callbacks and state management ✅
   - `src/sockets/schedule.handler.js` - Socket event emitters ✅

## Known Limitations

1. **Test Data:** TestSchedule uses hardcoded route_id, bus_id, driver_id

   - Ensure database has corresponding records
   - Route ID 1, Bus ID 1, Driver IDs 2-3 should exist

2. **Date Format:** All dates sent as YYYY-MM-DD strings

   - Frontend normalizes to display format
   - Backend handles both Date objects and strings

3. **Socket Rooms:** Driver must be logged in to join their specific room
   - Socket connection uses sessionStorage token
   - Room name: `driver-${driverId}`

## Debugging

### If real-time updates not working:

1. **Check Backend Logs:**

   ```
   [DEBUG] updateSchedule - oldDriverId: X, newDriverId: Y, global.io: true
   📢 WebSocket update notification sent to driver Y
   ```

2. **Check Frontend Console (F12):**

   ```
   ✅ Connected to WebSocket: [socket-id]
   ✅ Driver 2 joined room: driver-2
   📝 Socket received schedule-updated: {...}
   📝 Updated scheduleData: {...}
   ```

3. **Common Issues:**
   - `global.io` is undefined: Backend socket initialization issue
   - Socket events not received: Check driver room membership
   - State not updating: Check callback function in Assignments.jsx
   - Date format error: Verify ngay_chay is either Date or YYYY-MM-DD string

## Performance Considerations

- **Socket emission is batched:** Only happens once per operation
- **State updates are minimal:** Only affected date keys are updated
- **No full page reloads:** Improves UX significantly
- **Memory efficient:** No duplicate data structures

## Future Enhancements

1. Add WebSocket acknowledgment from driver (optional)
2. Implement conflict resolution for simultaneous updates
3. Add offline queue for operations when connection is lost
4. Implement optimistic updates with rollback
5. Add rate limiting on socket emissions

## Rollback Plan

If issues arise:

1. Revert changes to `schedule.service.js` (lines 322-390)
2. Frontend code is backward compatible - no rollback needed
3. Test component can be disabled by removing from sidebar

---

**Status:** ✅ READY FOR TESTING

**Test Date:** 2025-02-14

**Next Steps:**

1. Run full test suite
2. Verify all three operations work real-time
3. Test driver reassignment scenario
4. Performance monitoring in production
