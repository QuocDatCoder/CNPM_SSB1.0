# Test Driver Schedule Integration

## Changes Made

### 1. Dashboard.jsx Updates

✅ Added `useEffect` to fetch schedule on component mount
✅ Calls `ScheduleService.getMySchedule()`
✅ Filters schedule for today's date
✅ Transforms backend data to component format
✅ Shows loading state while fetching
✅ Shows error message if API fails
✅ Shows "no trips" message if today has no trips
✅ Displays max 2 trips (morning + afternoon)

### 2. Assignments.jsx Updates

✅ Added `useEffect` to fetch schedule on mount
✅ Imports `ScheduleService`
✅ Shows loading state in both day and week views
✅ Shows error state if API fails
✅ Uses real backend data instead of hardcoded sample

## Testing Steps

### Step 1: Login as Driver

1. Navigate to frontend app
2. Login with driver account
3. Driver dashboard should load

### Step 2: Verify Dashboard

1. Check "Trang chủ" tab
2. Should show "Các chuyến đi được phân công hôm nay"
3. If today has trips, should display morning and afternoon trips
4. Each trip should show:
   - Shift badge (Sáng/Chiều)
   - Route name
   - Time and locations
   - "Bắt đầu chuyến đi" button

### Step 3: Verify Assignments Page

1. Click "Xem lịch trình phân công" in sidebar
2. Should show day view by default
3. Can toggle between "Theo ngày" and "Theo tuần"
4. Should display trip details for selected date

## API Endpoint Used

- **GET /api/schedules/driver/my-schedule**
- Requires: Authentication token (verifyToken middleware)
- Returns: Object with dates as keys, arrays of trips as values

```json
{
  "2025-11-25": [
    {
      "id": 13,
      "type": "morning",
      "title": "Lượt đi",
      "time": "06:00",
      "route": "Xe: 51B-001.01 - Tuyến 1",
      "startLocation": "Crescent Mall",
      "endLocation": "Trường THPT",
      "status": "hoanthanh"
    }
  ]
}
```

## Troubleshooting

### Issue: Loading state never ends

- Check browser console for API errors
- Verify token is in sessionStorage (logged in?)
- Check backend server is running on port 8080

### Issue: "Không thể tải lịch trình" error

- Verify auth token is valid
- Check backend response in Network tab
- Look at backend logs for errors

### Issue: No trips showing but today should have some

- Check `/api/schedules/driver/my-schedule` response
- Verify schedule was assigned to logged-in driver in database
- Check date format is YYYY-MM-DD

## Code Locations

- Dashboard home: `frontend/src/pages/driver/Dashboard.jsx`
- Assignments page: `frontend/src/pages/driver/Assignments.jsx`
- Service: `frontend/src/services/schedule.service.js`
- Backend controller: `backend/src/api/controllers/schedule.controller.js`
- Backend service: `backend/src/services/schedule.service.js`
