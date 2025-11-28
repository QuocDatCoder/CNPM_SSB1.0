# Quick Test Guide - Real-time Schedule Updates

## 🚀 Quick Start (2 minutes)

### Step 1: Prepare Two Browsers/Tabs

```
Tab 1: Admin (localhost:5173/admin) - Schedule Manager
Tab 2: Driver (localhost:5173/driver) - Driver Dashboard
```

### Step 2: Test in Admin Tab

1. Click **"Test Lịch trình"** in sidebar
2. Click **"🔄 Run ALL Tests"** button
3. Watch logs update in real-time

### Step 3: Watch Driver Tab

Should see schedules:

1. ✅ Appear in real-time (for ADD)
2. ✅ Update in real-time (for UPDATE)
3. ✅ Disappear in real-time (for DELETE)

**🎯 All should happen WITHOUT page reload**

---

## 🧪 Test Cases

### Test Case 1: ADD Schedule

**Expected:**

- Schedule appears immediately in driver dashboard
- Date shows in bold if today/tomorrow
- Time displays in 24-hour format

**Verify in Console (F12):**

```
📢 New schedule assigned: {...}
📢 Updated scheduleData: {[date]: [{schedule}]}
```

### Test Case 2: UPDATE Schedule

**Expected:**

- Schedule time updates in real-time
- If date changes, schedule moves to new date
- If reassigned to different driver, appears for new driver

**Verify in Console:**

```
📝 Schedule updated: {...}
📝 Updated scheduleData: {[date]: [{updated_schedule}]}
```

### Test Case 3: DELETE Schedule

**Expected:**

- Schedule disappears from dashboard immediately
- Empty state shows if no more schedules that day

**Verify in Console:**

```
🗑️ Schedule deleted: {...}
🗑️ Updated scheduleData after deletion: {[date]: [...remaining]}
```

---

## 🐛 Troubleshooting

### Problem: Updates require page reload

**Check:**

1. Backend terminal shows `📢 WebSocket notification sent to driver X`?
2. Browser console (F12) shows `📝 Socket received` messages?
3. Is driver logged in (check sessionStorage in Console)?

### Problem: Driver doesn't see new schedules

**Check:**

1. Driver ID in test form matches driver login
2. Backend shows `✅ Driver X joined room: driver-X`
3. No red errors in backend terminal

### Problem: Data shows as undefined/null

**Check:**

1. Database has valid routes (route_id: 1)
2. Database has valid buses (bus_id: 1)
3. Drivers exist (driver_id: 2-3)

---

## 📊 Backend Console Output

### ✅ Successful Operation

```
[DEBUG] updateSchedule - oldDriverId: 2, newDriverId: 3, global.io: true
📢 WebSocket delete notification sent to old driver 2
📢 WebSocket update notification sent to driver 3
```

### ❌ Failed Operation

```
[DEBUG] updateSchedule - oldDriverId: undefined, newDriverId: undefined, global.io: false
[DEBUG] Skipping WebSocket update - has io: false
```

---

## 📈 Performance Metrics

**Expected Performance:**

- Socket emission: < 100ms
- Frontend state update: < 50ms
- UI render: < 200ms
- **Total:** < 350ms from click to visual update

---

## 🎬 Video Test Scenario

If you want to record/screenshot the feature:

1. **Setup (30s):**

   - Open two browser windows
   - Log in as Admin in Tab 1
   - Log in as Driver 2 in Tab 2
   - Navigate to Test page in Tab 1, Dashboard in Tab 2

2. **Test (1m):**

   - Click "Run ALL Tests"
   - Record Tab 2 showing real-time updates
   - Point out NO page reload occurred

3. **Cleanup (10s):**
   - Clear test data (optional)

---

## ✅ Sign-off Checklist

- [ ] ADD: New schedule appears in real-time
- [ ] UPDATE: Schedule changes without reload
- [ ] DELETE: Schedule removed without reload
- [ ] REASSIGN: Old driver sees deletion, new driver sees addition
- [ ] Console: No red error messages
- [ ] Backend: All socket events logged
- [ ] Performance: Updates in < 1 second
- [ ] Multiple ops: Can run tests repeatedly without issues

---

**Status:** Ready for QA Testing ✅

**Questions?** Check backend terminal or browser console (F12) for detailed logs
