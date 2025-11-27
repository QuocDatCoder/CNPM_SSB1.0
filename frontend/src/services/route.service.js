import api from "./api";

/**
 * Route Service - Quản lý tuyến đường
 * Endpoints: /api/routes, /api/stops
 */

const RouteService = {
  /**
   * Lấy danh sách tất cả tuyến đường
   * @returns {Promise<Array>}
   */
  async getAllRoutes() {
    try {
      const routes = await api.get("/routes");

      // Map dữ liệu cho dropdown
      return routes.map((route) => ({
        id: route.id,
        routeName: route.ten_tuyen,
        description: route.mo_ta,
        loai_tuyen: route.loai_tuyen,
      }));
    } catch (error) {
      console.error("Error fetching routes:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách tuyến cho Student (gộp lượt đi/về thành 1)
   * @returns {Promise<Array>}
   */
  async getRoutesForStudent() {
    try {
      const routes = await api.get("/routes");

      // Gộp các tuyến có cùng tên (lượt đi/về)
      const groupedRoutes = [];
      const processed = new Set();

      routes.forEach((route) => {
        if (processed.has(route.id)) return;

        // Tìm tuyến ngược (lượt về nếu đang là lượt đi, hoặc ngược lại)
        const baseName = route.ten_tuyen.replace(/: .+ - .+$/, "");
        const counterpart = routes.find(
          (r) =>
            r.id !== route.id &&
            r.ten_tuyen.startsWith(baseName) &&
            r.loai_tuyen !== route.loai_tuyen
        );

        if (counterpart) {
          // Có cặp lượt đi/về - chỉ lấy 1 (ưu tiên lượt đi)
          const mainRoute =
            route.loai_tuyen === "luot_di" ? route : counterpart;
          processed.add(route.id);
          processed.add(counterpart.id);

          groupedRoutes.push({
            id: mainRoute.id, // Sử dụng ID của lượt đi
            routeName: mainRoute.ten_tuyen, // Giữ nguyên tên đầy đủ của lượt đi
            description: mainRoute.mo_ta,
            loai_tuyen: mainRoute.loai_tuyen,
          });
        } else {
          // Không có cặp - giữ nguyên
          processed.add(route.id);
          groupedRoutes.push({
            id: route.id,
            routeName: route.ten_tuyen,
            description: route.mo_ta,
            loai_tuyen: route.loai_tuyen,
          });
        }
      });

      return groupedRoutes;
    } catch (error) {
      console.error("Error fetching routes for student:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách routes với stops (cho Route Management page)
   * @returns {Promise<Array>}
   */
  async getAllRoutesWithStops() {
    try {
      const routes = await api.get("/routes");

      // Fetch stops cho mỗi route
      const routesWithStops = await Promise.all(
        routes.map(async (route) => {
          try {
            const stops = await api.get(`/routes/${route.id}/stops`);

            return {
              id: route.id.toString().padStart(3, "0"),
              name: route.ten_tuyen || `Tuyến ${route.id}`,
              street: route.mo_ta || route.ten_tuyen || "Chưa có mô tả",
              distance: route.khoang_cach ? `${route.khoang_cach}km` : "0km",
              duration: route.thoi_gian_du_kien
                ? `${route.thoi_gian_du_kien} phút`
                : "0 phút",
              time: route.khung_gio || "6:00–18:00",
              loai_tuyen: route.loai_tuyen || "luot_di",
              mapImage: "/image/map-route.png",
              stops: stops.map((stop, index) => {
                const lat = parseFloat(stop.latitude);
                const lng = parseFloat(stop.longitude);

                return {
                  id: stop.id,
                  name: stop.ten_diem || `Trạm ${index + 1}`,
                  position: [
                    !isNaN(lat) ? lat : 10.762622,
                    !isNaN(lng) ? lng : 106.660172,
                  ],
                  time: stop.gio_don_du_kien || `${6 + index}:00`,
                  address: stop.dia_chi || "",
                };
              }),
              // Lấy điểm đầu/cuối từ stops
              start:
                stops.length > 0
                  ? [
                      !isNaN(parseFloat(stops[0].latitude))
                        ? parseFloat(stops[0].latitude)
                        : 10.762622,
                      !isNaN(parseFloat(stops[0].longitude))
                        ? parseFloat(stops[0].longitude)
                        : 106.660172,
                    ]
                  : [10.762622, 106.660172],
              end:
                stops.length > 0
                  ? [
                      !isNaN(parseFloat(stops[stops.length - 1].latitude))
                        ? parseFloat(stops[stops.length - 1].latitude)
                        : 10.776889,
                      !isNaN(parseFloat(stops[stops.length - 1].longitude))
                        ? parseFloat(stops[stops.length - 1].longitude)
                        : 106.700928,
                    ]
                  : [10.776889, 106.700928],
              startName:
                stops.length > 0 ? stops[0].ten_diem || "Điểm đầu" : "Điểm đầu",
              endName:
                stops.length > 0
                  ? stops[stops.length - 1].ten_diem || "Điểm cuối"
                  : "Điểm cuối",
            };
          } catch (error) {
            console.error(`Error fetching stops for route ${route.id}:`, error);
            return {
              id: route.id.toString().padStart(3, "0"),
              name: route.ten_tuyen || `Tuyến ${route.id}`,
              street: route.mo_ta || route.ten_tuyen || "Chưa có mô tả",
              distance: route.khoang_cach ? `${route.khoang_cach}km` : "0km",
              duration: route.thoi_gian_du_kien
                ? `${route.thoi_gian_du_kien} phút`
                : "0 phút",
              time: route.khung_gio || "6:00–18:00",
              loai_tuyen: route.loai_tuyen || "luot_di",
              mapImage: "/image/map-route.png",
              stops: [],
              start: [10.762622, 106.660172],
              end: [10.776889, 106.700928],
              startName: "Điểm đầu",
              endName: "Điểm cuối",
            };
          }
        })
      );

      return routesWithStops;
    } catch (error) {
      console.error("Error fetching routes:", error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết một tuyến
   * @param {string} id - ID tuyến
   * @returns {Promise<Object>}
   */
  async getRouteById(id) {
    try {
      const route = await api.get(`/routes/${id}`);
      const stops = await api.get(`/routes/${id}/stops`);

      return {
        id: route.id.toString().padStart(3, "0"),
        name: route.ten_tuyen,
        street: route.mo_ta || route.ten_tuyen,
        distance: `${route.khoang_cach}km`,
        duration: `${route.thoi_gian_du_kien} phút`,
        time: route.khung_gio || "4:00–6:00",
        loai_tuyen: route.loai_tuyen,
        stops: stops.map((stop, index) => ({
          id: stop.id,
          name: stop.ten_diem,
          position: [parseFloat(stop.latitude), parseFloat(stop.longitude)],
          time: stop.gio_don_du_kien || `${4 + index * 5}:00`,
          address: stop.dia_chi,
        })),
        start:
          stops.length > 0
            ? [parseFloat(stops[0].latitude), parseFloat(stops[0].longitude)]
            : [10.762622, 106.660172],
        end:
          stops.length > 0
            ? [
                parseFloat(stops[stops.length - 1].latitude),
                parseFloat(stops[stops.length - 1].longitude),
              ]
            : [10.776889, 106.700928],
        startName: stops.length > 0 ? stops[0].ten_diem : "Điểm đầu",
        endName:
          stops.length > 0 ? stops[stops.length - 1].ten_diem : "Điểm cuối",
      };
    } catch (error) {
      console.error("Error fetching route details:", error);
      throw error;
    }
  },

  /**
   * Lấy tất cả các trạm dừng
   * @returns {Promise<Array>}
   */
  async getAllStops() {
    try {
      const stops = await api.get("/stops");
      return stops.map((stop) => ({
        id: stop.id,
        stopName: stop.ten_diem,
        address: stop.dia_chi,
        latitude: parseFloat(stop.latitude),
        longitude: parseFloat(stop.longitude),
      }));
    } catch (error) {
      console.error("Error fetching stops:", error);
      throw error;
    }
  },

  /**
   * Lấy các trạm dừng của một tuyến cụ thể
   * @param {string|number} routeId - ID của tuyến
   * @returns {Promise<Array>}
   */
  async getStopsByRoute(routeId) {
    try {
      const stops = await api.get(`/routes/${routeId}/stops`);
      return stops.map((stop) => ({
        id: stop.id,
        stopName: stop.ten_diem,
        address: stop.dia_chi,
        latitude: parseFloat(stop.latitude),
        longitude: parseFloat(stop.longitude),
      }));
    } catch (error) {
      console.error(`Error fetching stops for route ${routeId}:`, error);
      throw error;
    }
  },
};

export default RouteService;
