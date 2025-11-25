const { Bus, Schedule, Route } = require('../data/models');
const { Op } = require('sequelize');

// 1. Lấy danh sách 
const getAllBuses = async () => {
    try {
        const today = new Date();
        
        // B1: Lấy danh sách xe (Raw)
        const buses = await Bus.findAll({
            order: [['id', 'ASC']]
        });

        // B2: Tìm lịch trình cho từng xe 
        const formattedBuses = await Promise.all(buses.map(async (bus) => {
            
            const currentSchedule = await Schedule.findOne({
                where: { 
                    bus_id: bus.id,
                    ngay_chay: today 
                },
                include: [{ model: Route, attributes: ['ten_tuyen'] }]
            });

            const routeName = currentSchedule ? currentSchedule.Route.ten_tuyen : "Chưa phân công";

            return {
                id: bus.id, 
                licensePlate: bus.bien_so_xe,
                manufacturer: bus.hang_xe || "",
                seats: bus.so_ghe,
                yearManufactured: bus.nam_san_xuat || 0,
                distanceTraveled: parseFloat(bus.so_km_da_chay || 0),
                maintenanceDate: bus.lich_bao_duong || null,
                
                status: bus.trang_thai,
                
                route: routeName,
                image: "/image/bus.png"
            };
        }));

        return formattedBuses;

    } catch (error) {
        throw error;
    }
};

// 2. Thêm xe mới (Map Key: Anh -> Việt, Value: Giữ nguyên)
const createBus = async (dataFE) => {
    const busDataDB = {
        bien_so_xe: dataFE.licensePlate,
        hang_xe: dataFE.manufacturer,
        nam_san_xuat: dataFE.yearManufactured,
        so_ghe: dataFE.seats,
        so_km_da_chay: dataFE.distanceTraveled,
        lich_bao_duong: dataFE.maintenanceDate,
        trang_thai: dataFE.status 
    };
    return await Bus.create(busDataDB);
};

// 3. Sửa thông tin xe
const updateBus = async (id, dataFE) => {
    const bus = await Bus.findByPk(id);
    if (!bus) return null;

    const updateData = {};
    if (dataFE.licensePlate) updateData.bien_so_xe = dataFE.licensePlate;
    if (dataFE.manufacturer) updateData.hang_xe = dataFE.manufacturer;
    if (dataFE.yearManufactured) updateData.nam_san_xuat = dataFE.yearManufactured;
    if (dataFE.seats) updateData.so_ghe = dataFE.seats;
    if (dataFE.distanceTraveled) updateData.so_km_da_chay = dataFE.distanceTraveled;
    if (dataFE.maintenanceDate) updateData.lich_bao_duong = dataFE.maintenanceDate;
    if (dataFE.status) updateData.trang_thai = dataFE.status;

    await bus.update(updateData);
    return bus;
};

// 4. Xóa xe
const deleteBus = async (id) => {
    const bus = await Bus.findByPk(id);
    if (!bus) return null;
    await bus.destroy();
    return true;
};

module.exports = { getAllBuses, createBus, updateBus, deleteBus };