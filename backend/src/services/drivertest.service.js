const { User } = require("../data/models");

// 1. Lấy danh sách Tài xế
const getAllDrivers = async () => {
  const drivers = await User.findAll({
    where: { vai_tro: "taixe" },
    attributes: [
      "id",
      "driver_code",
      "ho_ten",
      "ngay_sinh",
      "gioi_tinh",
      "so_dien_thoai",
      "dia_chi",
      "email",
      "bang_lai",
      "username",
      "trang_thai_taixe",
    ],
  });

  // Auto-fix any drivers with null driver_code
  for (const driver of drivers) {
    if (!driver.driver_code) {
      const lastDriver = await User.findOne({
        where: {
          vai_tro: "taixe",
          driver_code: { [require("sequelize").Op.ne]: null },
        },
        order: [["driver_code", "DESC"]],
      });
      driver.driver_code = lastDriver ? lastDriver.driver_code + 1 : 1;
      await driver.save();
    }
  }

  return drivers;
};

// 2. Tạo nhanh Tài xế (Test)
const createDriverTest = async (data) => {
  // Auto-generate driver_code if not provided
  if (!data.driver_code) {
    const lastDriver = await User.findOne({
      where: { vai_tro: "taixe" },
      order: [["driver_code", "DESC"]],
    });
    data.driver_code = lastDriver ? lastDriver.driver_code + 1 : 1;
  }

  return await User.create({
    ...data,
    vai_tro: "taixe",
    password_hash: data.password_hash || "123456", // Use provided password or default
    trang_thai_taixe: data.trang_thai_taixe || "Đang hoạt động",
  });
};

// 3. Cập nhật Tài xế
const updateDriverTest = async (id, data) => {
  const driver = await User.findByPk(id);
  if (!driver || driver.vai_tro !== "taixe") {
    return null;
  }

  await driver.update(data);
  return driver;
};

// 4. Xóa Tài xế
const deleteDriverTest = async (id) => {
  const driver = await User.findByPk(id);
  if (!driver || driver.vai_tro !== "taixe") {
    throw new Error("Không tìm thấy tài xế!");
  }

  await driver.destroy();
  return true;
};

module.exports = {
  getAllDrivers,
  createDriverTest,
  updateDriverTest,
  deleteDriverTest,
};
