# 🔧 Developer's Debugging Guide

## Quick Diagnosis Flowchart

```
Real-time update not working?
    ↓
1. Check Backend Logs
    - Look for: "📢 WebSocket notification sent"
    - If NOT present: Socket not emitted (go to step 4)
    - If present: Socket emitted (go to step 2)
    ↓
2. Check Frontend Console (F12 → Console)
    - Look for: "📝 Socket received schedule-updated"
    - If NOT present: Not received (check socket connection)
    - If present: Received (go to step 3)
    ↓
3. Check React State
    - Run in console:
      JSON.parse(sessionStorage.getItem('scheduleData'))
    - Compare with received data
    - If different: State update issue (go to step 5)
    - If same: ✅ Everything working!
    ↓
4. Backend Socket Not Emitting
    - Is global.io defined?
    - Is driver_id valid?
    - Check error: console.error() shows what failed
    ↓
5. Frontend State Not Updating
    - Callback not called? Check if listener registered
    - State update logic wrong? Check normalizeDate()
    - Date mismatch? Check schedule data format
```

---

## 🔍 Detailed Debugging Scenarios

### Scenario 1: "Update shows in console but not on screen"

**Root Causes:**

1. State update logic incorrect
2. Component re-render blocked
3. Date key mismatch

**Debug Steps:**

```javascript
// 1. Check if callback executed
// In Assignments.jsx onScheduleUpdated callback, add:
console.log("BEFORE state update:", scheduleData);
setScheduleData((prevData) => {
  console.log("IN setState updater:", prevData);
  // ... state logic ...
  console.log("AFTER state update:", newData);
  return newData;
});

// 2. Check if date key is correct
const dateKey = normalizeDate(updatedSchedule.date);
console.log("Date string received:", updatedSchedule.date);
console.log("Normalized date key:", dateKey);
console.log("Data exists in state for this date?", !!prevData[dateKey]);

// 3. Check React DevTools
// Install: https://react-devtools-tutorial.vercel.app/
// Watch: Does scheduleData actually change in DevTools?
```

### Scenario 2: "Backend says socket sent, but frontend didn't receive"

**Root Causes:**

1. Driver not in room
2. Socket connection dropped
3. Different socket instances

**Debug Steps:**

```javascript
// Backend - Check room membership
// Add to schedule.service.js before emit:
const roomName = `driver-${newDriverId}`;
const clientsInRoom = global.io.sockets.adapter.rooms.get(roomName);
console.log(`[DEBUG] Room ${roomName} has ${clientsInRoom?.size || 0} clients`);

// Frontend - Check connection
// In useDriverScheduleSocket.js:
socket.on("connect", () => {
  console.log("FRONTEND: Connected to socket with ID:", socket.id);
  console.log("FRONTEND: Current driver ID:", driverId);
  socket.emit("join-driver-room", { driverId });
});

// Verify in browser:
// 1. Open Console (F12)
// 2. Paste: window.localStorage.getItem('socket.io-session')
// 3. Should not be empty
```

### Scenario 3: "Socket events fire but wrong data received"

**Root Causes:**

1. Data structure mismatch
2. Field name typos
3. Type conversion issues

**Debug Steps:**

```javascript
// Backend - Log exact payload
const scheduleHandler = require("../sockets/schedule.handler");
const payload = {
  id: updatedSchedule.id,
  date: dateStr,
  time: updatedSchedule.gio_bat_dau,
  // ... other fields
};
console.log("[DEBUG] Emitting payload:", JSON.stringify(payload, null, 2));

// Frontend - Log received data
socket.on("schedule-updated", (data) => {
  console.log("[DEBUG] Received data:", JSON.stringify(data, null, 2));
  console.log("[DEBUG] data.data:", JSON.stringify(data.data, null, 2));
});

// Compare field by field
// Expected:
// {
//   "success": true,
//   "message": "...",
//   "data": {
//     "id": 123,
//     "date": "2025-02-20",
//     "time": "08:00:00",
//     ...
//   }
// }
```

### Scenario 4: "Date parsing fails"

**Root Causes:**

1. Unexpected date format
2. Type checking issue
3. Timezone problem

**Debug Steps:**

```javascript
// Backend - Log date before conversion
console.log("Raw ngay_chay:", updatedSchedule.ngay_chay);
console.log("Type:", typeof updatedSchedule.ngay_chay);
console.log("Is Date?:", updatedSchedule.ngay_chay instanceof Date);
console.log("String includes T?:", updatedSchedule.ngay_chay.includes?.("T"));

// Frontend - Log date normalization
const normalizeDate = (date) => {
  console.log("Input:", date, "Type:", typeof date);
  if (typeof date === "string") {
    const result = date.split("T")[0];
    console.log("Result:", result);
    return result;
  }
  // ... other cases
};
```

---

## 🎯 Common Error Messages & Fixes

### Error: "updatedSchedule.ngay_chay.toISOString is not a function"

```
Cause: ngay_chay is a string, not a Date object
Fix: Use date format detection (already in code)
Verification:
  - Console: typeof updatedSchedule.ngay_chay
  - Should be "string" not "object"
```

### Error: "Cannot read property 'driver_id' of null"

```
Cause: Schedule not found in database
Fix: Check if id parameter is valid
Verification:
  - Backend: Is id from URL params correct?
  - Database: Does schedule with this id exist?
  - API: POST/PUT with valid ID
```

### Error: "global.io is undefined"

```
Cause: Socket.io not initialized
Fix: Check server.js initialization
Verification:
  - Backend console: Should show "✅ Auth routes loaded"
  - Check if Socket.io middleware is registered
  - Restart backend server
```

### Error: "Socket join failed"

```
Cause: Driver not authenticated or ID is 0
Fix: Ensure driver is logged in and has valid ID
Verification:
  - Frontend: Check sessionStorage.getItem('user')
  - User object should have id property
  - ID should be > 0
```

---

## 📊 Performance Debugging

### Check Socket Latency

```javascript
// Backend - measure emit time
const start = Date.now();
global.io.to(roomName).emit("schedule-updated", data);
console.log(`[PERF] Socket emit took ${Date.now() - start}ms`);

// Frontend - measure state update
const updateStart = Date.now();
setScheduleData((prevData) => {
  console.log(`[PERF] State update processing: ${Date.now() - updateStart}ms`);
  return newData;
});

// Expected: < 100ms for backend, < 50ms for frontend
```

### Memory Leak Detection

```javascript
// Check if listeners are properly cleaned up
// In useDriverScheduleSocket.js, verify cleanup:
return () => {
  if (socket) {
    socket.emit("leave-driver-room", { driverId });
    socket.disconnect();
    // Listeners automatically removed when socket disconnects
  }
};

// Verify in browser:
// 1. Open multiple driver dashboards
// 2. Close them one by one
// 3. Check Memory tab in DevTools
// 4. Should see memory decrease as tabs close
```

---

## 🧪 Manual Testing Commands

### Test 1: Check Socket Connection

**Browser Console:**

```javascript
// Verify socket is connected
console.log("Socket ID:", window.io?.readyState);
// Expected: "OPEN" (numeric: 1)

// Verify room membership
io.sockets.adapter?.rooms;
// Should see entries like: Map { 'driver-2' => Set(1) }
```

### Test 2: Manually Trigger Update

**Backend Terminal:**

```javascript
// In node console (not recommended for production!)
// Simulate what schedule.service.js does:
const roomName = "driver-2";
global.io.to(roomName).emit("schedule-updated", {
  success: true,
  data: {
    id: 1,
    date: "2025-02-20",
    time: "08:00:00",
    route: "Test Route",
    type: "luot_di",
  },
});
console.log("Emitted to room:", roomName);
```

### Test 3: Check Database Data

**Backend Terminal (using sequelize CLI):**

```bash
# First, connect to database
npm install -g sequelize-cli

# Query schedules
sqlite3 smart_bus_tracking.db "SELECT id, driver_id, ngay_chay FROM schedules LIMIT 5;"

# Or in Node REPL:
# const { Schedule } = require('./src/data/models');
# Schedule.findAll({ limit: 5 }).then(s => console.table(s))
```

---

## 🔐 Debugging Safely in Production

### DO ✅

- Use console.log with meaningful prefixes like `[DEBUG]`, `[PERF]`, `[ERROR]`
- Keep debug logs for 24 hours then remove
- Use environment variable to enable/disable debug mode
- Monitor logs centrally (e.g., ELK stack)

### DON'T ❌

- Leave `console.log` for sensitive data (passwords, tokens)
- Log full request/response bodies without filtering
- Use `debugger` statement (blocks execution)
- Print to stdout (use stderr for errors)

### Production Debug Mode

```javascript
// In schedule.service.js
const DEBUG = process.env.DEBUG_SCHEDULE === "true";

if (DEBUG) {
  console.log(`[DEBUG] updateSchedule - oldDriverId: ${oldDriverId}`);
}

// Enable: DEBUG_SCHEDULE=true npm start
// Disable: npm start (default)
```

---

## 📈 Monitoring Checklist

### Daily

- [ ] No WebSocket errors in backend logs
- [ ] Average socket latency < 100ms
- [ ] No duplicate events received
- [ ] Memory usage stable

### Weekly

- [ ] Review socket event logs
- [ ] Check for any disconnection patterns
- [ ] Verify no race conditions
- [ ] Performance metrics trending

### Before Deployment

- [ ] All debug logs removed/disabled
- [ ] Error handling complete
- [ ] Socket timeouts configured
- [ ] Rollback plan documented

---

## 🆘 When All Else Fails

### Nuclear Option: Check Everything

```bash
# 1. Restart services
cd CNPM_SSB1.0/backend && npm start &
cd CNPM_SSB1.0/frontend && npm run dev &

# 2. Clear browser cache
# DevTools → Application → Clear All

# 3. Check database integrity
sqlite3 smart_bus_tracking.db ".check"

# 4. Verify no port conflicts
netstat -ano | findstr "8080\|5173"

# 5. Fresh browser tab
# Open incognito window, test again

# 6. Enable all debug logging
DEBUG=* npm start
```

### Get Help

1. **Check logs first:**

   - Backend terminal output
   - Browser console (F12)
   - Browser Network tab (WebSocket)

2. **Provide to support:**

   - Full error message (copy-paste)
   - Browser console screenshot
   - Backend terminal output
   - Steps to reproduce

3. **Collect diagnostics:**

   ```bash
   # Save terminal output
   npm start 2>&1 | tee debug.log

   # Export browser console
   # In console: copy(console.memory)
   ```

---

## 📚 Reference Links

- [Socket.io Debugging](https://socket.io/docs/v4/socket-io-protocol/)
- [React DevTools](https://react-devtools-tutorial.vercel.app/)
- [Chrome DevTools Network Tab](https://developer.chrome.com/docs/devtools/network/)
- [Sequelize Debugging](https://sequelize.org/docs/v6/other-topics/usage/#logging)

---

**Last Updated:** 2025-02-14  
**For Questions:** Check backend logs first, then frontend console
