const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db.config");

const Bus = sequelize.define(
  "Bus",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bien_so_xe: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    hang_xe: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    nam_san_xuat: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    so_ghe: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
    },
    so_km_da_chay: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    lich_bao_duong: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // -------------------------------
    trang_thai: {
      type: DataTypes.ENUM("Đang hoạt động", "Bảo trì", "Ngừng"),
      defaultValue: "Ngừng",
    },
  },
  {
    tableName: "Buses",
    timestamps: false,
  }
);

module.exports = Bus;
