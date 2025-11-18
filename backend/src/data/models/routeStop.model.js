const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const RouteStop = sequelize.define('RouteStop', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  route_id: { type: DataTypes.INTEGER, allowNull: false },
  stop_id: { type: DataTypes.INTEGER, allowNull: false },
  thu_tu: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gio_don_du_kien: {
    type: DataTypes.TIME,
    allowNull: true
  }
}, {
  tableName: 'RouteStops',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['route_id', 'thu_tu'],
      name: 'route_order_unique'
    }
  ]
});

module.exports = RouteStop;