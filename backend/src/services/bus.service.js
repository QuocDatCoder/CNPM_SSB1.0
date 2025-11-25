const { Bus, Schedule, Route } = require('../data/models');
const { Op } = require('sequelize');

// 1. Lấy danh sách tất cả xe buýt
const getAllBuses = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset giờ về 0 để so sánh ngày chính xác

        // B1: Lấy danh sách xe
        const buses = await Bus.findAll({
            order: [['id', 'ASC']]
        });

        // B2: Tìm lịch trình hôm nay của từng xe để lấy tên tuyến
        const formattedBuses = await Promise.all(buses.map(async (bus) => {
            
            // Tìm xem hôm nay xe này chạy tuyến nào
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
                bien_so_xe: bus.bien_so_xe,         
                hang_xe: bus.hang_xe || "",          
                so_ghe: bus.so_ghe,                 
                nam_san_xuat: bus.nam_san_xuat || 0,
                so_km_da_chay: parseFloat(bus.so_km_da_chay || 0), 
                lich_bao_duong: bus.lich_bao_duong || null,        
                trang_thai: bus.trang_thai,         
                
                ten_tuyen: routeName,                
                image: "/image/bus.png"
            };
        }));

        return formattedBuses;

    } catch (error) {
        throw error;
    }
};

// 2. Thêm xe mới
const createBus = async (data) => {
    try {
        return await Bus.create(data);
    } catch (error) {
        throw error;
    }
};

// 3. Sửa thông tin xe (Chỉ cập nhật những field được cung cấp)
const updateBus = async (id, data) => {
    try {
        const bus = await Bus.findByPk(id);
        if (!bus) return null;

        await bus.update(data);
        return bus;
    } catch (error) {
        throw error;
    }
};

// 4. Xóa xe theo ID
const deleteBus = async (id) => {
    try {
        const bus = await Bus.findByPk(id);
        if (!bus) return null;
        await bus.destroy();
        return true;
    } catch (error) {
        throw error;
    }
};

module.exports = { getAllBuses, createBus, updateBus, deleteBus };