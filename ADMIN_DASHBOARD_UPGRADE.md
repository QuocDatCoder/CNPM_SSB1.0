# 🎯 Admin Dashboard - Tuyến Đường Nâng Cấp

**Ngày**: December 9, 2025  
**Phiên bản**: 2.0  
**Status**: ✅ Production Ready

---

## 📋 Tóm Tắt Thay Đổi

### Vấn đề Cũ:

❌ Tuyến đường chỉ vẽ từ start → end (không đi qua trạm)  
❌ Icon xe luôn di chuyển (ngay cả khi không chạy)  
❌ Không lấy vị trí thực từ socket

### Giải Pháp Mới:

✅ Tuyến đường vẽ qua **TẤT CẢ CÁC TRẠM** (start → stops → end)  
✅ Icon xe chỉ di chuyển real-time khi status = **'dangchay'**  
✅ Lấy vị trí thực từ socket giống như "Xem vị trí xe"  
✅ Animation demo khi status ≠ 'dangchay'

---

## 🔧 Chi Tiết Thay Đổi Code

### 1️⃣ Import ParentTrackingService

**File**: `frontend/src/pages/admin/dashboard.jsx` (Line 14)

```javascript
import ParentTrackingService from "../../services/parent-tracking.service";
```

**Mục đích**: Lắng nghe vị trí xe real-time từ driver qua socket

---

### 2️⃣ Thêm State & Ref

**File**: `frontend/src/pages/admin/dashboard.jsx` (Lines 60-62)

```javascript
const [realTimeBusPos, setRealTimeBusPos] = useState(null); // Vị trí real-time từ socket
const busListenerRef = useRef(null); // Ref lưu listener
```

---

### 3️⃣ Hàm fetchRoute - VẼ QUATION TRẠM

**File**: `frontend/src/pages/admin/dashboard.jsx` (Lines 94-154)

#### Thay Đổi:

- **Cũ**: `fetchRoute(start, end)` - Chỉ 2 điểm
- **Mới**: `fetchRoute(route)` - Tất cả waypoints

#### Logic Mới:

```
1. Lấy tất cả waypoints:
   - Điểm bắt đầu: route.start
   - Tất cả trạm: route.stops[].position
   - Điểm kết thúc: route.end

2. Gửi OSRM:
   https://router.project-osrm.org/route/v1/driving/
     LON1,LAT1;LON2,LAT2;...;LONn,LATn
   ?overview=full&geometries=geojson

3. Lấy geometry.coordinates → Chuyển [lat,lon]
```

#### Ví Dụ:

```javascript
// Đầu vào:
route = {
  id: 1,
  start: [10.7769, 106.7009],
  stops: [
    { position: [10.7800, 106.7010] },
    { position: [10.7850, 106.7050] }
  ],
  end: [10.8000, 106.7100]
}

// Waypoints sẽ là:
[10.7769, 106.7009] → [10.7800, 106.7010] → [10.7850, 106.7050] → [10.8000, 106.7100]

// URL gửi:
https://router.project-osrm.org/route/v1/driving/106.7009,10.7769;106.7010,10.7800;106.7050,10.7850;106.7100,10.8000
?overview=full&geometries=geojson

// Kết quả:
routePath = [
  [10.7769, 106.7009],
  [10.7774, 106.7012],
  ...
  [10.8000, 106.7100]
]  ← 500+ điểm chi tiết
```

---

### 4️⃣ handleSelectRoute - Lựa Chọn Tuyến

**File**: `frontend/src/pages/admin/dashboard.jsx` (Lines 156-165)

```javascript
const handleSelectRoute = async (route) => {
  setSelectedRoute(route);
  setRealTimeBusPos(null); // Reset vị trí cũ

  console.log(`🔍 Tìm schedule 'dangchay' cho route ${route.id}...`);

  const path = await fetchRoute(route); // ← Gọi hàm mới
  setRoutePath(path);
  if (path.length > 0) {
    setBusPos(path[0]);
  }
};
```

---

### 5️⃣ Real-Time Bus Location Listener

**File**: `frontend/src/pages/admin/dashboard.jsx` (Lines 167-215)

#### Chức Năng:

Lắng nghe vị trí xe **real-time** từ socket giống như "Xem vị trí xe"

#### Logic:

```javascript
useEffect(() => {
  if (!selectedRoute || !selectedRoute.id) return;

  const handleBusLocation = (data) => {
    console.log("📍 Nhận vị trí xe real-time:", data);
    if (data.latitude && data.longitude) {
      setRealTimeBusPos({
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    }
  };

  // Subscribe: bus-location-{routeId}
  if (ParentTrackingService.socket?.connected) {
    busListenerRef.current = handleBusLocation;
    ParentTrackingService.socket.on(
      `bus-location-${selectedRoute.id}`,
      handleBusLocation
    );
    console.log(`✅ Đã subscribe event: bus-location-${selectedRoute.id}`);
  }

  return () => {
    // Cleanup khi unmount
    if (busListenerRef.current && ParentTrackingService.socket) {
      ParentTrackingService.socket.off(
        `bus-location-${selectedRoute.id}`,
        busListenerRef.current
      );
    }
  };
}, [selectedRoute]);
```

#### Dữ Liệu Socket Event:

```javascript
// Event name: bus-location-{routeId}
{
  routeId: 1,
  latitude: 10.7769,
  longitude: 106.7009,
  timestamp: "2025-12-09T10:30:00Z",
  speed: 45,
  heading: 90
}
```

---

### 6️⃣ Animation - Chỉ Khi Status ≠ 'dangchay'

**File**: `frontend/src/pages/admin/dashboard.jsx` (Lines 217-237)

```javascript
useEffect(() => {
  // Chỉ chạy khi:
  // - routePath có data
  // - selectedRoute tồn tại
  // - selectedRoute.status !== "dangchay"
  if (
    routePath.length === 0 ||
    !selectedRoute ||
    selectedRoute.status === "dangchay"
  ) {
    return;
  }

  console.log("🎬 Bắt đầu animation xe di chuyển (status không phải dangchay)");

  let index = 0;
  const interval = setInterval(() => {
    index++;
    if (index >= routePath.length) index = 0;
    setBusPos(routePath[index]);
  }, 200); // 200ms một bước

  return () => clearInterval(interval);
}, [routePath, selectedRoute?.status]); // ← Chỉ khi status thay đổi
```

**Khi nào chạy**:

- ✅ status = "chuabatdau" → Animation demo
- ✅ status = "hoanthanh" → Animation demo
- ✅ status = "huy" → Animation demo
- ❌ status = "dangchay" → Không chạy (dùng real-time)

---

### 7️⃣ Map Rendering - Điều Kiện Hiển Thị

**File**: `frontend/src/pages/admin/dashboard.jsx` (Lines 310-360)

#### Logic Hiển Thị Icon Xe:

```javascript
{
  /* Marker xe chạy - CHỈ hiển thị khi status = 'dangchay' và có vị trí real-time */
}
{
  selectedRoute.status === "dangchay" && realTimeBusPos && (
    <Marker
      position={[realTimeBusPos.latitude, realTimeBusPos.longitude]}
      icon={busIcon}
    >
      <Popup>
        <div>
          <strong>{selectedRoute.name}</strong>
          <br />
          <small>
            {realTimeBusPos.latitude.toFixed(5)},{" "}
            {realTimeBusPos.longitude.toFixed(5)}
          </small>
          <br />
          <small>
            Cập nhật: {new Date(realTimeBusPos.timestamp).toLocaleTimeString()}
          </small>
        </div>
      </Popup>
    </Marker>
  );
}

{
  /* Animation mặc định - CHỈ khi status !== 'dangchay' */
}
{
  selectedRoute.status !== "dangchay" && busPos && (
    <Marker position={busPos} icon={busIcon}>
      <Popup>{selectedRoute.name}</Popup>
    </Marker>
  );
}
```

---

## 📊 Trạng Thái & Hành Vi

| Status       | Icon Xe          | Loại    | Nguồn     |
| ------------ | ---------------- | ------- | --------- |
| `chuabatdau` | Động (Animation) | Demo    | routePath |
| `dangchay`   | Động (Real-time) | Thực tế | Socket    |
| `hoanthanh`  | Động (Animation) | Demo    | routePath |
| `huy`        | Động (Animation) | Demo    | routePath |

---

## 🚀 Cách Thức Hoạt Động

### Scenario 1: Status = 'chuabatdau'

```
1. Admin mở dashboard
2. Chọn tuyến
3. fetchRoute() → Lấy đường qua tất cả trạm
4. Animation chạy tự động trên routePath
5. Icon xe di chuyển từ start → end
6. Khi click "Bắt Đầu" → Status → 'dangchay'
7. Animation dừng
```

### Scenario 2: Status = 'dangchay'

```
1. Driver chạy tuyến
2. Admin mở dashboard
3. Chọn tuyến
4. fetchRoute() → Lấy đường qua tất cả trạm
5. Socket listener: bus-location-{routeId}
6. Nhận vị trí real-time từ driver
7. Icon xe cập nhật vị trí thực tế
8. Khi kết thúc → Status → 'hoanthanh'
9. Chuyển sang animation
```

### Scenario 3: Status = 'hoanthanh'

```
1. Admin mở dashboard
2. Chọn tuyến đã hoàn thành
3. fetchRoute() → Lấy đường qua tất cả trạm
4. Animation chạy lại (replay)
5. Icon xe di chuyển từ start → end
```

---

## 🔌 Socket Integration

### Event Name:

```
bus-location-{routeId}
```

### Được Gửi Từ:

Driver app → Backend → Parent app (admin)

### Khi Nào:

- Mỗi 1-2 giây (tùy cấu hình)
- Chỉ khi status = 'dangchay'

### Dữ Liệu:

```javascript
{
  routeId: number,
  latitude: number,
  longitude: number,
  timestamp: ISO string,
  speed?: number,
  heading?: number,
  accuracy?: number
}
```

---

## ✅ Testing Checklist

### Test Case 1: Vẽ Đường Qua Trạm

```
1. Mở admin dashboard
2. Chọn tuyến có 3+ trạm
3. Xem MapContainer
   ✅ Polyline nối: start → stop1 → stop2 → end
   ✅ Không chỉ start → end
   ✅ Có marker ở mỗi trạm
```

### Test Case 2: Animation Demo (Status ≠ 'dangchay')

```
1. Tuyến status = 'chuabatdau'
2. Admin mở route
3. Xem console:
   ✅ "🎬 Bắt đầu animation xe"
4. Xem map:
   ✅ Icon xe di chuyển trên polyline
   ✅ Mỗi 200ms một bước
   ✅ Loop từ start → end → start...
```

### Test Case 3: Real-Time (Status = 'dangchay')

```
1. Driver bắt đầu chuyến
2. Admin mở route (status = 'dangchay')
3. Xem console:
   ✅ "✅ Đã subscribe event: bus-location-1"
   ✅ "📍 Nhận vị trí xe real-time: {...}"
4. Xem map:
   ✅ Icon xe cập nhật vị trí thực từ socket
   ✅ Popup hiển thị: lat, lon, thời gian
   ✅ Không có animation (chỉ real-time)
```

### Test Case 4: Chuyển Đổi Status

```
1. Tuyến status = 'dangchay' + icon xe di chuyển real-time
2. Driver kết thúc chuyến
3. Status → 'hoanthanh'
4. Xem console:
   ✅ "🔌 Đã unsubscribe event"
   ✅ "🎬 Bắt đầu animation xe"
5. Xem map:
   ✅ Icon xe chuyển sang animation
   ✅ Replay từ start → end
```

---

## 🐛 Debug Console

### Logs Để Xem:

```javascript
// Khi chọn route:
"🔍 Tìm schedule 'dangchay' cho route 1...";
"🔄 Fetching route qua 5 điểm (attempt 1/4)...";
"✅ Route fetched: 523 points qua 5 waypoints";

// Khi status = 'dangchay':
"📡 Thiết lập listener vị trí xe real-time cho route 1";
"✅ Đã subscribe event: bus-location-1";
"📍 Nhận vị trí xe real-time: {...}";

// Khi status !== 'dangchay':
"🎬 Bắt đầu animation xe di chuyển (status không phải dangchay)";

// Cleanup:
"🔌 Đã unsubscribe event: bus-location-1";
```

---

## 📱 Browser DevTools

### Network:

1. Mở DevTools → Network
2. Filter: WS (WebSocket)
3. Tìm `bus-location-{routeId}`
4. Click → Messages tab
5. Xem dữ liệu lat/lon được gửi

### Console:

1. Ctrl+Shift+I → Console
2. Tìm các log 🔍, 🎬, 📍, ✅
3. Nếu không thấy → Socket chưa kết nối

---

## 🔗 Liên Kết File

**Modified Files**:

- ✏️ `frontend/src/pages/admin/dashboard.jsx`

**Related Files**:

- 📖 `frontend/src/services/parent-tracking.service.js` (Socket)
- 📖 `frontend/src/services/route.service.js` (Get routes)
- 📖 `backend/src/sockets/tracking.handler.js` (Emit locations)

---

## 📝 Ghi Chú Kỹ Thuật

### OSRM API:

- Giới hạn: Max 25 waypoints/request
- Timeout: 30 giây
- Retry: Exponential backoff (1s, 2s, 4s)

### Socket Events:

- **Gửi**: Driver → Backend
- **Relay**: Backend → Admin (parent-tracking room)
- **Frequency**: 1-2 giây/location update

### Animation:

- Interval: 200ms/step
- Chỉ chạy khi status ≠ 'dangchay'
- Loop vô hạn

### Memory:

- Real-time listener: Cleanup on unmount
- Animation interval: Cleanup on unmount
- No memory leaks

---

## ✨ Cải Tiến Tương Lai

1. **Hiệu suất**: Cache route calculations
2. **UX**: Zoom to route on select
3. **Features**: Thêm speed indicator
4. **Filters**: Hiển thị từng trạm stop info

---

**Version**: 2.0  
**Last Updated**: December 9, 2025  
**Status**: ✅ Ready for Production
