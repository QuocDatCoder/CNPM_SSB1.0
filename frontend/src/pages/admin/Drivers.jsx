import React, { useState, useEffect } from "react";
import Header from "../../components/common/Header/header";
import "./Drivers.css";
import DriverService from "../../services/driver.service";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1); // 1: Thông tin, 2: Tài khoản
  const [currentPage, setCurrentPage] = useState(1);
  const driversPerPage = 5;
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [editedDriver, setEditedDriver] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newDriver, setNewDriver] = useState({
    fullname: "",
    dob: "",
    gender: "Nam",
    phone: "",
    email: "",
    address: "",
    licenseNumber: "",
  });
  const [accountInfo, setAccountInfo] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const data = await DriverService.getAllDrivers();
      setDrivers(data);
    } catch (error) {
      console.error("Error loading drivers:", error);
      alert("Không thể tải dữ liệu tài xế. Vui lòng kiểm tra kết nối backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (driverCode) => {
    const driver = drivers.find((d) => d.code === driverCode);
    if (!driver) return;

    if (
      window.confirm(`Bạn có chắc chắn muốn xóa tài xế ${driver.fullname}?`)
    ) {
      try {
        await DriverService.deleteDriver(driver.id);
        alert("Đã xóa tài xế!");

        // Reload danh sách tài xế
        await loadDrivers();
      } catch (error) {
        console.error("Error deleting driver:", error);
        alert("Không thể xóa tài xế. Vui lòng thử lại!");
      }
    }
  };

  const handleInfo = (code) => {
    const driver = drivers.find((d) => d.code === code);
    if (driver) {
      setSelectedDriver(driver);
      setEditedDriver({ ...driver });
      setIsEditMode(false);
      setShowInfoModal(true);
    }
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSaveEdit = async () => {
    try {
      await DriverService.updateDriver(editedDriver.id, editedDriver);
      setSelectedDriver(editedDriver);
      setIsEditMode(false);
      alert("Đã cập nhật thông tin tài xế!");

      // Reload danh sách tài xế
      await loadDrivers();
      setShowInfoModal(false);
    } catch (error) {
      console.error("Error updating driver:", error);
      alert("Không thể cập nhật thông tin tài xế. Vui lòng thử lại!");
    }
  };

  const handleAdd = () => {
    setShowAddModal(true);
    setAddStep(1);
    setNewDriver({
      fullname: "",
      dob: "",
      gender: "Nam",
      phone: "",
      email: "",
      address: "",
      licenseNumber: "",
    });
    setAccountInfo({
      username: "",
      password: "",
    });
  };

  const handleNextStep = () => {
    if (addStep === 1) {
      // Validate thông tin tài xế
      if (!newDriver.fullname || !newDriver.phone || !newDriver.email) {
        alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
        return;
      }
      setAddStep(2);
    }
  };

  const handleCreateDriver = async () => {
    // Validate tài khoản
    if (!accountInfo.username || !accountInfo.password) {
      alert("Vui lòng điền đầy đủ thông tin tài khoản!");
      return;
    }

    try {
      const driverData = {
        ...newDriver,
        username: accountInfo.username,
        password: accountInfo.password,
      };

      await DriverService.createDriver(driverData);
      alert(
        `Đã thêm tài xế ${newDriver.fullname} với tài khoản ${accountInfo.username}!`
      );
      setShowAddModal(false);

      // Reload danh sách tài xế
      await loadDrivers();
    } catch (error) {
      console.error("Error creating driver:", error);
      alert("Không thể tạo tài xế mới. Vui lòng thử lại!");
    }
  };

  const filtered = drivers.filter((d) => {
    const q = query.toLowerCase();
    return (
      d.code.toLowerCase().includes(q) ||
      d.fullname.toLowerCase().includes(q) ||
      d.phone.includes(q)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / driversPerPage);
  const indexOfLastDriver = currentPage * driversPerPage;
  const indexOfFirstDriver = indexOfLastDriver - driversPerPage;
  const currentDrivers = filtered.slice(indexOfFirstDriver, indexOfLastDriver);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset về trang 1 khi tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  return (
    <div className="drivers-page">
      <Header title="Tài xế" />

      <div className="drivers-content">
        <div className="drivers-controls">
          <button className="add-driver-btn" onClick={handleAdd}>
            Thêm tài xế mới
          </button>
          <input
            className="search-input"
            placeholder="Tìm kiếm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="drivers-table">
          <div className="table-header-driver">
            <div className="col col-code">Mã</div>
            <div className="col col-name">Họ và tên</div>
            <div className="col col-dob">Ngày sinh</div>
            <div className="col col-phone">Số điện thoại</div>
            <div className="col col-trips">Số chuyến/tháng</div>
            <div className="col col-actions">Thao tác</div>
          </div>

          {currentDrivers.map((driver, index) => (
            <div className="table-row-driver" key={index}>
              <div className="col col-code">{driver.code}</div>
              <div className="col col-name">{driver.fullname}</div>
              <div className="col col-dob">{driver.dob}</div>
              <div className="col col-phone">{driver.phone}</div>
              <div className="col col-trips">{driver.monthlyTrips || 0}</div>
              <div className="col col-actions">
                <button
                  className="info-btn"
                  onClick={() => handleInfo(driver.code)}
                  title="Thông tin"
                >
                  <img src="/icons/infor.png" alt="Info" />
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(driver.code)}
                  title="Xóa"
                >
                  <img src="/icons/delete.png" alt="Delete" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="no-results">Không có tài xế phù hợp.</div>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                className={`pagination-btn ${
                  currentPage === index + 1 ? "active" : ""
                }`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button
              className="pagination-btn"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Modal xem/chỉnh sửa thông tin tài xế */}
      {showInfoModal && selectedDriver && (
        <div
          className="driver-modal-overlay"
          onClick={() => {
            setShowInfoModal(false);
            setIsEditMode(false);
          }}
        >
          <div
            className="driver-info-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="driver-info-header">
              <div className="driver-info-avatar">
                <img
                  src="image/avata.png"
                  alt={selectedDriver.fullname}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              </div>
              <h2 className="driver-info-name">
                {isEditMode ? "Chỉnh Sửa Thông Tin" : selectedDriver.fullname}
              </h2>
            </div>

            <div className="driver-info-content">
              <div className="driver-info-left">
                <div className="driver-info-field">
                  <label>Ngày Sinh:</label>
                  {isEditMode ? (
                    <input
                      type="date"
                      value={editedDriver.dob}
                      onChange={(e) =>
                        setEditedDriver({
                          ...editedDriver,
                          dob: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{selectedDriver.dob}</span>
                  )}
                </div>

                <div className="driver-info-field">
                  <label>Giới tính:</label>
                  {isEditMode ? (
                    <div className="driver-gender-group">
                      <label className="driver-radio-label">
                        <input
                          type="radio"
                          name="edit-gender"
                          value="Nam"
                          checked={editedDriver.gender === "Nam"}
                          style={{ accentColor: "black" }}
                          onChange={(e) =>
                            setEditedDriver({
                              ...editedDriver,
                              gender: e.target.value,
                            })
                          }
                        />
                        Nam
                      </label>
                      <label className="driver-radio-label">
                        <input
                          type="radio"
                          name="edit-gender"
                          value="Nữ"
                          checked={editedDriver.gender === "Nữ"}
                          style={{ accentColor: "black" }}
                          onChange={(e) =>
                            setEditedDriver({
                              ...editedDriver,
                              gender: e.target.value,
                            })
                          }
                        />
                        Nữ
                      </label>
                    </div>
                  ) : (
                    <span>{selectedDriver.gender}</span>
                  )}
                </div>

                <div className="driver-info-field">
                  <label>Số điện thoại:</label>
                  {isEditMode ? (
                    <input
                      type="tel"
                      value={editedDriver.phone}
                      onChange={(e) =>
                        setEditedDriver({
                          ...editedDriver,
                          phone: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{selectedDriver.phone}</span>
                  )}
                </div>

                <div className="driver-info-field">
                  <label>Email:</label>
                  {isEditMode ? (
                    <input
                      type="email"
                      value={editedDriver.email}
                      onChange={(e) =>
                        setEditedDriver({
                          ...editedDriver,
                          email: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{selectedDriver.email}</span>
                  )}
                </div>

                <div className="driver-info-field">
                  <label>Bằng Lái:</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedDriver.licenseNumber}
                      onChange={(e) =>
                        setEditedDriver({
                          ...editedDriver,
                          licenseNumber: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{selectedDriver.licenseNumber}</span>
                  )}
                </div>
                <div className="driver-info-field">
                  <label>Địa chỉ:</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedDriver.address}
                      onChange={(e) =>
                        setEditedDriver({
                          ...editedDriver,
                          address: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{selectedDriver.address}</span>
                  )}
                </div>
              </div>

              <div className="driver-info-right">
                <div className="driver-account-fields">
                  <h3>Tài khoản tài xế</h3>

                  <div className="driver-info-field">
                    <label>Tài khoản:</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={
                          editedDriver.username || "driver" + editedDriver.code
                        }
                        onChange={(e) =>
                          setEditedDriver({
                            ...editedDriver,
                            username: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span>
                        {selectedDriver.username ||
                          "driver" + selectedDriver.code}
                      </span>
                    )}
                  </div>

                  <div className="driver-info-field">
                    <label>Mật khẩu:</label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      {isEditMode ? (
                        <input
                          type={showPassword ? "text" : "password"}
                          value={editedDriver.password || ""}
                          onChange={(e) =>
                            setEditedDriver({
                              ...editedDriver,
                              password: e.target.value,
                            })
                          }
                          style={{ flex: 1 }}
                        />
                      ) : (
                        <span style={{ flex: 1 }}>
                          {showPassword
                            ? selectedDriver.password || "123456"
                            : "••••••••"}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "5px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title={
                          showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                        }
                      >
                        {showPassword ? (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="#666"
                          >
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                          </svg>
                        ) : (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="#666"
                          >
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="driver-info-actions">
              {isEditMode ? (
                <button className="driver-btn-primary" onClick={handleSaveEdit}>
                  Cập nhật
                </button>
              ) : (
                <button className="driver-btn-edit" onClick={handleEditToggle}>
                  <img
                    style={{ width: "20px", height: "20px" }}
                    src="icons/edit2.png"
                    alt="editDriver"
                  />
                  Chỉnh Sửa
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm tài xế */}
      {showAddModal && (
        <div
          className="driver-modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div className="driver-modal" onClick={(e) => e.stopPropagation()}>
            {addStep === 1 ? (
              <>
                <h2 className="driver-modal-title">Thêm tài xế mới</h2>
                <div className="add-driver-container">
                  <div className="driver-avatar-section">
                    <div className="driver-avatar-circle">
                      <svg
                        viewBox="0 0 24 24"
                        fill="#10b981"
                        width="48"
                        height="48"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <p className="driver-avatar-label">Tài xế mới</p>
                  </div>

                  <div className="driver-form">
                    <div className="driver-form-row">
                      <label>
                        Họ và tên: <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={newDriver.fullname}
                        onChange={(e) =>
                          setNewDriver({
                            ...newDriver,
                            fullname: e.target.value,
                          })
                        }
                        placeholder="Nguyễn Văn A"
                      />
                    </div>

                    <div className="driver-form-row">
                      <label>Ngày Sinh:</label>
                      <input
                        type="date"
                        value={newDriver.dob}
                        onChange={(e) =>
                          setNewDriver({ ...newDriver, dob: e.target.value })
                        }
                      />
                    </div>

                    <div className="driver-form-row">
                      <label>Giới tính:</label>
                      <div className="driver-gender-group">
                        <label className="driver-radio-label">
                          <input
                            type="radio"
                            name="gender"
                            value="Nam"
                            checked={newDriver.gender === "Nam"}
                            style={{ accentColor: "black" }}
                            onChange={(e) =>
                              setNewDriver({
                                ...newDriver,
                                gender: e.target.value,
                              })
                            }
                          />
                          Nam
                        </label>
                        <label className="driver-radio-label">
                          <input
                            type="radio"
                            name="gender"
                            value="Nữ"
                            checked={newDriver.gender === "Nữ"}
                            style={{ accentColor: "black" }}
                            onChange={(e) =>
                              setNewDriver({
                                ...newDriver,
                                gender: e.target.value,
                              })
                            }
                          />
                          Nữ
                        </label>
                      </div>
                    </div>

                    <div className="driver-form-row">
                      <label>
                        Số Điện Thoại: <span className="required">*</span>
                      </label>
                      <input
                        type="tel"
                        value={newDriver.phone}
                        onChange={(e) =>
                          setNewDriver({ ...newDriver, phone: e.target.value })
                        }
                        placeholder="0987654321"
                      />
                    </div>

                    <div className="driver-form-row">
                      <label>
                        Email: <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        value={newDriver.email}
                        onChange={(e) =>
                          setNewDriver({ ...newDriver, email: e.target.value })
                        }
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="driver-form-row">
                      <label>Địa Chỉ:</label>
                      <input
                        type="text"
                        value={newDriver.address}
                        onChange={(e) =>
                          setNewDriver({
                            ...newDriver,
                            address: e.target.value,
                          })
                        }
                        placeholder="Quận 1, TP.HCM"
                      />
                    </div>

                    <div className="driver-form-row">
                      <label>Số bằng lái:</label>
                      <input
                        type="text"
                        value={newDriver.licenseNumber}
                        onChange={(e) =>
                          setNewDriver({
                            ...newDriver,
                            licenseNumber: e.target.value,
                          })
                        }
                        placeholder="LX-123456"
                      />
                    </div>
                  </div>
                </div>

                <div className="driver-modal-actions">
                  <button
                    className="driver-btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="driver-btn-primary"
                    onClick={handleNextStep}
                  >
                    Tiếp theo
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="driver-modal-title">Tạo tài khoản tài xế</h2>
                <div className="driver-avatar-section">
                  <div className="driver-avatar-circle">
                    <svg
                      viewBox="0 0 24 24"
                      fill="#10b981"
                      width="48"
                      height="48"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <p className="driver-avatar-label">Tài xế mới</p>
                </div>

                <div className="driver-form">
                  <div className="driver-form-row">
                    <label>
                      Tài khoản tài xế: <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountInfo.username}
                      onChange={(e) =>
                        setAccountInfo({
                          ...accountInfo,
                          username: e.target.value,
                        })
                      }
                      placeholder="Tên đăng nhập"
                    />
                  </div>

                  <div className="driver-form-row">
                    <label>
                      Mật khẩu: <span className="required">*</span>
                    </label>
                    <input
                      type="password"
                      value={accountInfo.password}
                      onChange={(e) =>
                        setAccountInfo({
                          ...accountInfo,
                          password: e.target.value,
                        })
                      }
                      placeholder="Mật khẩu"
                    />
                  </div>
                </div>

                <div className="driver-modal-actions">
                  <button
                    className="driver-btn-secondary"
                    onClick={() => setAddStep(1)}
                  >
                    Quay lại
                  </button>
                  <button
                    className="driver-btn-primary"
                    onClick={handleCreateDriver}
                  >
                    Tạo tài khoản
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
