const sequelize = require("../../config/db.config");

const User = require("./user.model");
const Bus = require("./bus.model");
const Stop = require("./stop.model");
const Route = require("./route.model");
const RouteStop = require("./routeStop.model");
const Student = require("./student.model");
const Schedule = require("./schedule.model");
const ScheduleStudent = require("./scheduleStudent.model");
const LocationHistory = require("./locationHistory.model");
const Notification = require("./notification.model");
const AssignmentHistory = require("./assignmentHistory.model");

// 2. Định nghĩa Mối quan hệ

// --- Users & Students ---
User.hasMany(Student, { foreignKey: "parent_id", as: "children" });
Student.belongsTo(User, { foreignKey: "parent_id", as: "parent" });

// --- Routes & Stops ---
Route.hasMany(RouteStop, { foreignKey: "route_id" });
RouteStop.belongsTo(Route, { foreignKey: "route_id" });

Stop.hasMany(RouteStop, { foreignKey: "stop_id" });
RouteStop.belongsTo(Stop, { foreignKey: "stop_id" });

RouteStop.hasMany(Student, { foreignKey: "default_route_stop_id_di" });
Student.belongsTo(RouteStop, {
  foreignKey: "default_route_stop_id_di",
  as: "defaultRouteStopDi",
});

RouteStop.hasMany(Student, { foreignKey: "default_route_stop_id_ve" });
Student.belongsTo(RouteStop, {
  foreignKey: "default_route_stop_id_ve",
  as: "defaultRouteStopVe",
});

// --- Schedules ---
Schedule.belongsTo(Route, { foreignKey: "route_id" });
Schedule.belongsTo(User, { foreignKey: "driver_id", as: "driver" });
Schedule.belongsTo(Bus, { foreignKey: "bus_id" });

// --- Schedule Students ---
Schedule.hasMany(ScheduleStudent, { foreignKey: "schedule_id" });
ScheduleStudent.belongsTo(Schedule, { foreignKey: "schedule_id" });
Stop.hasMany(ScheduleStudent, {
  foreignKey: "stop_id",
  onDelete: "CASCADE",
});

ScheduleStudent.belongsTo(Stop, {
  foreignKey: "stop_id",
  onDelete: "CASCADE",
});

Student.hasMany(ScheduleStudent, { foreignKey: "student_id" });
ScheduleStudent.belongsTo(Student, { foreignKey: "student_id" });

// --- Tracking & Noti ---
Schedule.hasMany(LocationHistory, { foreignKey: "schedule_id" });
User.hasMany(Notification, { foreignKey: "user_id_nhan", as: "notifications" });

// 3. Export
module.exports = {
  sequelize,
  User,
  Bus,
  Stop,
  Route,
  RouteStop,
  Student,
  Schedule,
  ScheduleStudent,
  LocationHistory,
  Notification,
  AssignmentHistory,
};
