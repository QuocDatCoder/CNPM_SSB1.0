const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db.config");

const AssignmentHistory = sequelize.define(
  "AssignmentHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tuyen: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    thao_tac: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    loai_tuyen: {
      type: DataTypes.ENUM("luot_di", "luot_ve"),
      allowNull: true,
    },
    thoi_gian: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    ngay_chay_thuc_te: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "AssignmentHistory",
    timestamps: false,
  }
);

module.exports = AssignmentHistory;
