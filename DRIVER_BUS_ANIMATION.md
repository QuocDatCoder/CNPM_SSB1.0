# 🚌 Icon Xe Bus Di Chuyển - Driver Active Trip Page

## 📋 Tổng quan

Tôi vừa thêm animation xe bus di chuyển trên tuyến đường trong **driver-active-trip-page**, giống như **admin dashboard**.

### ✨ Tính năng mới:

1. ✅ **Icon xe bus động** (`/icons/busmap.png`)
2. ✅ **Fetch route đi qua TẤT CẢ các trạm** (waypoints)
3. ✅ **Animation di chuyển mỗi 200ms**
4. ✅ **Tính tiến độ & khoảng cách tự động**
5. ✅ **Gửi vị trí real-time tới phụ huynh**

---

## 🔄 Flow Chi Tiết

### 1️⃣ Tài xế click "Bắt đầu chuyến đi"

**File:** `CNPM_SSB1.0/frontend/src/pages/driver/Dashboard.jsx`

```javascript
const handleStartTrip = async (route) => {
  // 1. Gọi API startTrip
  await TrackingService.startTrip(route.id);

  // 2. ✨ Fetch route đi qua TẤT CẢ các trạm (waypoints)
  const path = await fetchRouteFromOSRM(
    route.coordinates // [[lat,lng], [lat,lng], ...] - tất cả trạm
  );
  setRoutePath(path);

  // 3. Set vị trí ban đầu của xe
  if (path.length > 0) {
    setBusPos(path[0]);
  }

  // 4. Bắt đầu trip
  setActiveTrip(route);
  setTripStarted(true);
  setSelectedStation(0);
};
```

### 2️⃣ Hàm Fetch Route từ OSRM (Đi qua tất cả trạm)

```javascript
/**
 * 🚌 Fetch route từ OSRM đi qua TẤT CẢ các trạm (waypoints)
 * @param {Array} coordinates - Array tất cả tọa độ: [[lat, lng], [lat, lng], ...]
 * @returns {Array} Route coordinates từ OSRM
 */
const fetchRouteFromOSRM = async (coordinates) => {
  if (!coordinates || coordinates.length < 2) {
    console.warn("Invalid coordinates for OSRM");
    return [];
  }

  // 🌍 Tạo URL với tất cả waypoints
  // Format: /driving/lng,lat;lng,lat;lng,lat?overview=full&geometries=geojson
  //
  // VD: Nếu có 5 trạm
  // Coordinates: [[10.77, 106.66], [10.78, 106.67], [10.79, 106.68], ...]
  // URL: /driving/106.66,10.77;106.67,10.78;106.68,10.79;...
  const waypointsStr = coordinates
    .map((coord) => `${coord[1]},${coord[0]}`) // [lat,lng] → lng,lat
    .join(";");

  const url = `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson`;

  console.log("📍 Fetching OSRM route with waypoints:", coordinates.length);

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (!json.routes) {
      console.warn("No route found from OSRM");
      return [];
    }

    // Convert GeoJSON coordinates [lng, lat] → [lat, lng]
    const coords = json.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);

    console.log("✅ OSRM route fetched:", coords.length, "coordinates");
    return coords;
  } catch (error) {
    console.error("Error fetching OSRM route:", error);
    return [];
  }
};
```

- Trả về array coordinates: [[lat, lng], [lat, lng], ...]
  \*/
  const fetchRouteFromOSRM = async (startCoord, endCoord) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${startCoord[1]},${startCoord[0]};${endCoord[1]},${endCoord[0]}?overview=full&geometries=geojson`;

try {
const res = await fetch(url);
const json = await res.json();

    if (!json.routes) return [];

    // Convert GeoJSON coordinates [lng, lat] → [lat, lng]
    const coords = json.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
    return coords;

} catch (error) {
console.error("Error fetching OSRM route:", error);
return [];
}
};

````

### 3️⃣ Animation Xe Bus Di Chuyển

```javascript
/**
 * 🚌 Animation: Xe bus chạy dọc theo route qua TẤT CẢ trạm
 * - Cập nhật vị trí mỗi 200ms
 * - Tính tiến độ & khoảng cách
 * - Gửi vị trí tới backend
 *
 * VD: Nếu route có 300 coordinates từ OSRM
 * - Index 0 → Điểm đầu
 * - Index 100 → Qua trạm 1
 * - Index 200 → Qua trạm 2
 * - Index 299 → Điểm cuối
 */
useEffect(() => {
  if (!tripStarted || routePath.length === 0) return;

  let index = 0;

  const interval = setInterval(() => {
    index++;
    if (index >= routePath.length) index = 0;

    const currentPos = routePath[index];
    setBusPos(currentPos); // ← Icon xe bus nhảy tới vị trí mới

    // Cập nhật busLocation để gửi tới backend
    setBusLocation({
      latitude: currentPos[0],
      longitude: currentPos[1],
    });

    // Tính tiến độ & khoảng cách dựa trên số lượng points từ OSRM
    const percentage = (index / Math.max(routePath.length - 1, 1)) * 100;
    const distance = index * 0.1;

    setTripProgress({
      percentage,
      distanceCovered: distance,
      currentStop: null,
    });

    console.log("🚌 Bus moving:", {
      position: currentPos,
      progress: percentage.toFixed(1) + "%",
    });
  }, 200); // Mỗi 200ms - tốc độ animation

  return () => clearInterval(interval);
}, [tripStarted, routePath]);
````

### 4️⃣ Marker Xe Bus trên Map

```javascript
{
  /* Current bus location marker - với icon xe bus */
}
{
  busPos && (
    <Marker
      position={busPos} // ← Array [lat, lng]
      icon={busIcon} // ← Icon xe bus
      title="Vị trí xe bus hiện tại"
    >
      <Popup>
        <div style={{ textAlign: "center" }}>
          <strong>🚌 Vị trí xe bus</strong>
          <br />
          <span style={{ fontSize: "12px" }}>Lat: {busPos[0].toFixed(6)}</span>
          <br />
          <span style={{ fontSize: "12px" }}>Lon: {busPos[1].toFixed(6)}</span>
          <br />
          <span style={{ fontSize: "12px", color: "#3b82f6" }}>
            📊 Tiến độ: {tripProgress.percentage.toFixed(1)}%
          </span>
        </div>
      </Popup>
    </Marker>
  );
}
```

---

## 📊 So sánh: Trước vs Sau

| Khía cạnh         | ❌ Trước                          | ✅ Sau                                                                   |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------ |
| **Route**         | Chỉ từ điểm đầu → điểm cuối       | Qua **tất cả trạm**                                                      |
| **OSRM URL**      | `...;lng1,lat1;lng2,lat2`         | `...;lng1,lat1;lng2,lat2;lng3,lat3;...`                                  |
| **Waypoints**     | 2 điểm                            | N điểm (tất cả trạm)                                                     |
| **Độ chính xác**  | Thấp (2 điểm)                     | Cao (đi qua tất cả trạm)                                                 |
| **Ví dụ**: 5 trạm | `route/106.66,10.77;106.70,10.81` | `route/106.66,10.77;106.67,10.78;106.68,10.79;106.69,10.80;106.70,10.81` |

## 🔍 Ví dụ cụ thể

### Dữ liệu đầu vào:

```javascript
// Route có 5 trạm (từ BE)
route.coordinates = [
  [10.77, 106.66], // Trạm 1
  [10.78, 106.67], // Trạm 2
  [10.79, 106.68], // Trạm 3
  [10.8, 106.69], // Trạm 4
  [10.81, 106.7], // Trạm 5
];
```

### OSRM Request URL:

```
Trước:
https://router.project-osrm.org/route/v1/driving/106.66,10.77;106.70,10.81?overview=full&geometries=geojson

Sau: (Qua tất cả trạm)
https://router.project-osrm.org/route/v1/driving/106.66,10.77;106.67,10.78;106.68,10.79;106.69,10.80;106.70,10.81?overview=full&geometries=geojson
```

### OSRM Response:

```javascript
// OSRM trả về detailed route đi qua tất cả waypoints
{
  routes: [
    {
      geometry: {
        coordinates: [
          [106.66, 10.77], // Điểm khởi hành
          [106.661, 10.771], // Điểm 1
          [106.662, 10.772], // Điểm 2
          ...[106.67, 10.78], // Trạm 2 (waypoint)
          [106.671, 10.781], // Điểm tiếp theo
          ...[106.7, 10.81], // Trạm 5 (cuối cùng)
        ],
      },
    },
  ];
}
```

### Kết quả:

```javascript
// routePath sẽ có ~300-500 coordinates
// Xe bus sẽ đi qua từng điểm, không bỏ qua trạm nào
routePath.length = 450; // (VD)
```

---

### 5️⃣ Gửi Vị Trí tới Backend (Real-time)

```javascript
/**
 * ⚡ Gửi vị trí xe bus từ dashboard tài xế tới backend qua WebSocket
 * Phụ huynh sẽ nhận được thông qua bus-location-update event
 */
useEffect(() => {
  if (!tripStarted || !busLocation || !activeTrip) return;

  // Gửi vị trí tới backend mỗi 2 giây
  const sendInterval = setInterval(() => {
    if (busLocation) {
      TrackingService.sendBusLocation({
        latitude: busLocation.latitude,
        longitude: busLocation.longitude,
        scheduleId: activeTrip.id,
        driverId: user.id || user.driver_code,
        progressPercentage: tripProgress.percentage,
        distanceCovered: tripProgress.distanceCovered,
      });

      console.log("📤 Sent bus location to backend:", {
        latitude: busLocation.latitude,
        longitude: busLocation.longitude,
      });
    }
  }, 2000); // Mỗi 2 giây

  return () => clearInterval(sendInterval);
}, [
  tripStarted,
  busLocation,
  activeTrip,
  tripProgress,
  user.id,
  user.driver_code,
]);
```

---

## 🧪 Cách Test

### Bước 1: Khởi động Backend & Frontend

```bash
# Terminal 1: Backend
cd CNPM_SSB1.0/backend
npm start

# Terminal 2: Frontend
cd CNPM_SSB1.0/frontend
npm run dev
```

### Bước 2: Đăng nhập tài xế & Vào Dashboard

- Mở http://localhost:5173
- Login với tài khoản tài xế
- Xem danh sách chuyến đi

### Bước 3: Click "Bắt đầu chuyến đi"

**Console sẽ hiện:**

```
✅ OSRM route fetched: 425 coordinates
🚌 Bus moving: { position: [10.77, 106.66], progress: "0.2%", index: 1 }
🚌 Bus moving: { position: [10.7701, 106.661], progress: "0.4%", index: 2 }
... (mỗi 200ms)
📤 Sent bus location to backend: { latitude: 10.77, longitude: 106.66 }
... (mỗi 2 giây)
```

### Bước 4: Xem Icon Xe Bus Chạy

**Trên Driver Dashboard:**

- Map sẽ hiển thị icon xe bus (`/icons/busmap.png`)
- Icon di chuyển mượt mà dọc theo route thực tế
- Tiến độ cập nhật real-time (0% → 100%)
- Panel bên phải hiển thị "Tiến độ chuyến đi"

**Trên Parent Tracking (nếu mở 2 tab):**

- Icon xe bus cũng sẽ chạy theo (nhận từ WebSocket)

---

## 📊 State Management

| State          | Type    | Mô tả                                          |
| -------------- | ------- | ---------------------------------------------- |
| `routePath`    | Array   | Route từ OSRM: `[[lat, lng], ...]`             |
| `busPos`       | Array   | Vị trí hiện tại: `[lat, lng]`                  |
| `busLocation`  | Object  | `{ latitude, longitude }` để gửi backend       |
| `tripProgress` | Object  | `{ percentage, distanceCovered, currentStop }` |
| `tripStarted`  | Boolean | Chuyến đi đang hoạt động?                      |
| `activeTrip`   | Object  | Thông tin chuyến đi hiện tại                   |

---

## 🎯 Hành động khi kết thúc chuyến

```javascript
const handleEndTrip = async () => {
  try {
    // 1. Gọi API endTrip
    if (activeTrip) {
      await TrackingService.endTrip(activeTrip.id);
    }

    // 2. Reset states
    setTripStarted(false);
    setActiveTrip(null);
    setSelectedStation(0);
    setRoutePath([]); // ← Clear route
    setBusPos(null); // ← Clear bus position

    // 3. Clear sessionStorage
    sessionStorage.removeItem("tripStarted");
    sessionStorage.removeItem("activeTrip");
    sessionStorage.removeItem("selectedStation");
  } catch (error) {
    console.error("Error ending trip:", error);
    alert("Không thể kết thúc chuyến đi. Vui lòng thử lại.");
  }
};
```

---

## 🔧 Troubleshooting

### Vấn đề 1: Icon xe bus không hiển thị

**Nguyên nhân:** Icon `/icons/busmap.png` không tìm thấy
**Giải pháp:**

- Kiểm tra file tồn tại: `CNPM_SSB1.0/frontend/public/icons/busmap.png`
- Nếu không có, dùng icon mặc định hoặc tải từ CDN

### Vấn đề 2: Xe bus không chạy

**Nguyên nhân:** `routePath` rỗng hoặc OSRM không phản hồi
**Giải pháp:**

- Kiểm tra console log: `✅ OSRM route fetched: X coordinates`
- Nếu không thấy, thì OSRM API lỗi
- Fallback: Dùng `activeTrip.coordinates` thay vì OSRM

### Vấn đề 3: Animation chậm/quá nhanh

**Giải pháp:** Thay đổi interval

```javascript
}, 200);  // ← Đổi số này
```

- 100ms: Rất nhanh (mượt nhưng dễ lag)
- 200ms: Bình thường (hiện tại)
- 500ms: Chậm (lỗ mỗi bước)

### Vấn đề 4: Tiến độ không chính xác

**Giải pháp:** Kiểm tra công thức tính

```javascript
const percentage = (index / Math.max(routePath.length - 1, 1)) * 100;
const distance = index * 0.1; // ← Điều chỉnh hệ số này
```

---

## 🎨 Tùy chỉnh

### Thay đổi icon xe bus

```javascript
// 1. Tìm file trong public/icons/
// 2. Hoặc dùng CDN:

const busIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61088.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
```

### Thay đổi tốc độ animation

```javascript
setInterval(() => {
  // ...
}, 200); // ← 200ms, giảm = nhanh hơn, tăng = chậm hơn
```

### Thay đổi cách tính tiến độ

```javascript
// Hiện tại: dựa trên index
const percentage = (index / routePath.length) * 100;

// Nâng cao: dựa trên khoảng cách thực
const distanceRemaining = calculateDistance(currentPos, endPos);
const totalDistance = calculateDistance(startPos, endPos);
const percentage = ((totalDistance - distanceRemaining) / totalDistance) * 100;
```

---

## ✅ Checklist

- [x] Add busIcon definition
- [x] Add routePath & busPos state
- [x] Create fetchRouteFromOSRM function
- [x] Add animation effect
- [x] Update marker to use busPos
- [x] Send location to backend every 2s
- [x] Console logs for debugging
- [x] Reset on end trip

---

**Cập nhật:** 28/11/2025
**Status:** ✅ Hoàn thành
