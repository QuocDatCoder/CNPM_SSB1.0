const { Route, RouteStop, Stop } = require('../data/models');
// 1. API Lấy danh sách tất cả tuyến đường
const getAllRoutes = async () => {
    try {
        const routes = await Route.findAll({
            attributes: [
                'id', 
                'ten_tuyen', 
                'mo_ta', 
                'khoang_cach', 
                'thoi_gian_du_kien', 
                'khung_gio', 
                'loai_tuyen'
            ],
            raw: true 
        });
        return routes; 
    } catch (error) {
        throw error;
    }
};
// 2. API Lấy chi tiết một tuyến theo ID
const getRouteById = async (id) => {
    try {
        const route = await Route.findByPk(id, {
            raw: true
        });
        return route; 
    } catch (error) {
        throw error;
    }
};

// 3. API Lấy danh sách trạm của 1 tuyến cụ thể
const getStopsByRouteId = async (routeId) => {
    try {
        const routeStops = await RouteStop.findAll({
            where: { route_id: routeId },
            include: [{ 
                model: Stop,
                attributes: ['id', 'ten_diem', 'latitude', 'longitude', 'dia_chi'] 
            }],
            order: [['thu_tu', 'ASC']]
        });

        return routeStops.map(item => ({
            id: item.Stop.id,
            ten_diem: item.Stop.ten_diem,
            dia_chi: item.Stop.dia_chi,
            latitude: item.Stop.latitude,
            longitude: item.Stop.longitude,
            gio_don_du_kien: item.gio_don_du_kien,
            thu_tu: item.thu_tu
        }));
    } catch (error) {
        throw error;
    }
};

module.exports = { getAllRoutes, getRouteById, getStopsByRouteId };