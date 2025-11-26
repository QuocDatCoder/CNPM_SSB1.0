const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db.config");

const Schedule = sequelize.define(
  "Schedule",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    route_id: { type: DataTypes.INTEGER, allowNull: false },
    driver_id: { type: DataTypes.INTEGER, allowNull: true }, // Cho phép null - có thể phân công sau
    bus_id: { type: DataTypes.INTEGER, allowNull: true }, // Cho phép null - có thể phân công sau

    ngay_chay: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    trang_thai: {
      type: DataTypes.ENUM("chuabatdau", "dangchay", "hoanthanh", "huy"),
      defaultValue: "chuabatdau",
    },
    gio_bat_dau: { type: DataTypes.TIME, defaultValue: "06:00:00" },
    thoi_gian_bat_dau_thuc_te: { type: DataTypes.DATE },
    thoi_gian_ket_thuc_thuc_te: { type: DataTypes.DATE },
  },
  {
    tableName: "Schedules",
    timestamps: false,
    // Xóa unique indexes để cho phép tài xế/xe chạy nhiều chuyến (lượt đi + lượt về) trong cùng ngày
  }
);

module.exports = Schedule;
