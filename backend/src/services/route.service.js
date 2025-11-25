const { Route, RouteStop, Stop } = require('../data/models');

// Hàm helper: Format giờ từ "06:00:00" -> "6:00"
const formatTime = (timeStr) => {
    if (!timeStr) return "00:00";
    const [hour, minute] = timeStr.split(':');
    return `${parseInt(hour)}:${minute}`;
};

// 1. Lấy danh sách tất cả tuyến
const getAllRoutes = async () => {
    try {
        const routes = await Route.findAll({
            include: [
                {
                    model: RouteStop,
                    include: [{ 
                        model: Stop, 
                        // Lấy đủ thông tin để vẽ map
                        attributes: ['id', 'ten_diem', 'latitude', 'longitude'] 
                    }]
                }
            ]
        });

        const formattedRoutes = routes.map(route => {
            const stopsRaw = route.RouteStops || [];
            
            // 1. Sắp xếp trạm theo thứ tự 1, 2, 3...
            stopsRaw.sort((a, b) => a.thu_tu - b.thu_tu);

            // 2. Tìm trạm đầu và trạm cuối
            const firstStop = stopsRaw.length > 0 ? stopsRaw[0].Stop : null;
            const lastStop = stopsRaw.length > 0 ? stopsRaw[stopsRaw.length - 1].Stop : null;

            // 3. Format danh sách Stops con
            const stopsList = stopsRaw.map(s => ({
                id: s.Stop.id,
                name: `Trạm ${s.thu_tu}: ${s.Stop.ten_diem}`,
                position: [parseFloat(s.Stop.latitude), parseFloat(s.Stop.longitude)],
                time: formatTime(s.gio_don_du_kien)
            }));

            // 4. Trả về Object đúng format FE cần
            return {
                id: route.id,
                name: route.ten_tuyen,        
                street: route.mo_ta || "",     
                distance: `${route.khoang_cach}km`,
                duration: `${route.thoi_gian_du_kien} phút`,
                
                // Lấy từ DB (cột khung_gio bạn đã thêm) hoặc mặc định
                time: route.khung_gio || "05:00 - 21:00", 
                
                // Tọa độ Start/End [lat, lng]
                start: firstStop ? [parseFloat(firstStop.latitude), parseFloat(firstStop.longitude)] : [0, 0],
                end: lastStop ? [parseFloat(lastStop.latitude), parseFloat(lastStop.longitude)] : [0, 0],
                
                startName: firstStop ? firstStop.ten_diem : "",
                endName: lastStop ? lastStop.ten_diem : "",
                
                mapImage: "/image/map-route.png", // Hardcode ảnh theo yêu cầu
                
                stops: stopsList // Mảng các trạm
            };
        });

        return formattedRoutes;
    } catch (error) {
        throw error;
    }
};

// 2. Lấy chi tiết 1 tuyến (Format y hệt như trên)
const getRouteById = async (id) => {
    try {
        const route = await Route.findByPk(id, {
            include: [
                {
                    model: RouteStop,
                    include: [{ model: Stop }]
                }
            ]
        });

        if (!route) return null;

        const stopsRaw = route.RouteStops || [];
        stopsRaw.sort((a, b) => a.thu_tu - b.thu_tu);

        const firstStop = stopsRaw.length > 0 ? stopsRaw[0].Stop : null;
        const lastStop = stopsRaw.length > 0 ? stopsRaw[stopsRaw.length - 1].Stop : null;

        const stopsList = stopsRaw.map(s => ({
            id: s.Stop.id,
            name: `Trạm ${s.thu_tu}: ${s.Stop.ten_diem}`,
            position: [parseFloat(s.Stop.latitude), parseFloat(s.Stop.longitude)],
            time: formatTime(s.gio_don_du_kien)
        }));

        return {
            id: `00${route.id}`.slice(-3),
            name: route.ten_tuyen,
            street: route.mo_ta || "",
            distance: `${route.khoang_cach}km`,
            duration: `${route.thoi_gian_du_kien} phút`,
            time: route.khung_gio || "05:00 - 21:00",
            start: firstStop ? [parseFloat(firstStop.latitude), parseFloat(firstStop.longitude)] : [0, 0],
            end: lastStop ? [parseFloat(lastStop.latitude), parseFloat(lastStop.longitude)] : [0, 0],
            startName: firstStop ? firstStop.ten_diem : "",
            endName: lastStop ? lastStop.ten_diem : "",
            mapImage: "/image/map-route.png",
            stops: stopsList
        };
    } catch (error) {
        throw error;
    }
};

// 3. Hàm phụ: Lấy stops (Giữ lại hàm này nếu FE dùng API riêng lẻ)
const getStopsByRouteId = async (routeId) => {
    try {
        const routeStops = await RouteStop.findAll({
            where: { route_id: routeId },
            include: [{ model: Stop }],
            order: [['thu_tu', 'ASC']]
        });

        return routeStops.map(item => ({
            thu_tu: item.thu_tu,
            stop_id: item.Stop.id,
            ten_tram: item.Stop.ten_diem,
            dia_chi: item.Stop.dia_chi,
            gio_du_kien: formatTime(item.gio_don_du_kien),
            lat: parseFloat(item.Stop.latitude),
            lng: parseFloat(item.Stop.longitude)
        }));
    } catch (error) {
        throw error;
    }
};

module.exports = { getAllRoutes, getRouteById, getStopsByRouteId };