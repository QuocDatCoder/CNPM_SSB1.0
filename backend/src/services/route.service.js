const { Route, RouteStop, Stop } = require('../data/models');

// 1. Lấy danh sách tất cả tuyến (Kèm logic xử lý hiển thị cho Card)
const getAllRoutes = async () => {
    try {
        // Lấy dữ liệu thô từ DB (Join bảng RouteStop và Stop)
        const routes = await Route.findAll({
            include: [
                {
                    model: RouteStop,
                    include: [{ model: Stop, attributes: ['ten_diem'] }] // Chỉ lấy tên trạm
                }
            ]
        });

        // Xử lý dữ liệu để FE dễ hiển thị
        const formattedRoutes = routes.map(route => {
            const stops = route.RouteStops || [];
            
            stops.sort((a, b) => a.thu_tu - b.thu_tu);

            // Logic tìm điểm đầu và cuối
            const startPoint = stops.length > 0 ? stops[0].Stop.ten_diem : 'N/A';
            const endPoint = stops.length > 0 ? stops[stops.length - 1].Stop.ten_diem : 'N/A';

            return {
                id: route.id,
                ma_so: `00${route.id}`.slice(-3), 
                ten_tuyen: route.ten_tuyen,
                mo_ta: route.mo_ta,
                loai_tuyen: route.loai_tuyen, 
                loai_tuyen_text: route.loai_tuyen === 'luot_di' ? 'Lượt đi' : 'Lượt về',
                
                // Thông tin hiển thị lên thẻ
                khoang_cach: `${route.khoang_cach} km`,
                thoi_gian: `${route.thoi_gian_du_kien} phút`,
                so_tram: `${stops.length} trạm`,
                diem_dau_cuoi: `${startPoint} - ${endPoint}`
            };
        });

        return formattedRoutes;
    } catch (error) {
        throw error;
    }
};

// 2. Lấy chi tiết 1 tuyến (Để hiển thị danh sách trạm vào ô "Đường" khi xếp lịch)
const getRouteById = async (id) => {
    try {
        const route = await Route.findByPk(id, {
            include: [
                {
                    model: RouteStop,
                    include: [{ model: Stop }],
                }
            ],
            // Sắp xếp trạm khi query
            order: [[RouteStop, 'thu_tu', 'ASC']] 
        });
        return route;
    } catch (error) {
        throw error;
    }
};
// 3. Lấy danh sách các trạm của 1 tuyến (Sắp xếp theo thứ tự)
const getStopsByRouteId = async (routeId) => {
    try {
        const routeStops = await RouteStop.findAll({
            where: { route_id: routeId },
            include: [
                { 
                    model: Stop,
                    attributes: ['id', 'ten_diem', 'dia_chi', 'latitude', 'longitude'] 
                }
            ],
            order: [['thu_tu', 'ASC']] // Quan trọng: Sắp xếp từ trạm 1 -> trạm cuối
        });

        // Format lại dữ liệu cho đẹp để FE dễ dùng
        return routeStops.map(item => ({
            thu_tu: item.thu_tu,
            stop_id: item.Stop.id,
            ten_tram: item.Stop.ten_diem,
            dia_chi: item.Stop.dia_chi,
            gio_du_kien: item.gio_don_du_kien,
            lat: item.Stop.latitude,
            lng: item.Stop.longitude
        }));
    } catch (error) {
        throw error;
    }
};


module.exports = { getAllRoutes, getRouteById, getStopsByRouteId };