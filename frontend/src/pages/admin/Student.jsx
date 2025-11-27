import React, { useState, useEffect } from "react";
import Header from "../../components/common/Header/header";
import "./Student.css";
import StudentService from "../../services/student.service";
import RouteService from "../../services/route.service";

export default function Student() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editedStudent, setEditedStudent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [filteredStops, setFilteredStops] = useState([]); // Trạm thuộc tuyến đang chọn
  const [newStudent, setNewStudent] = useState({
    fullname: "",
    dob: "",
    gender: "Nam",
    class: "",
    teacher: "",
    route_id: "",
    stop_id: "",
    parentName: "",
    contact: "",
    parentEmail: "",
    address: "",
  });
  const [accountInfo, setAccountInfo] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([loadStudents(), loadRoutes(), loadStops()]);
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await StudentService.getAllStudents();
      // Map dữ liệu từ backend sang format giao diện
      const mappedStudents = data.map((student) => ({
        id: student.id,
        code: String(student.id).padStart(4, "0"),
        fullname: student.ho_ten,
        dob: student.ngay_sinh,
        gender: student.gioi_tinh,
        class: student.lop,
        teacher: student.gvcn,
        route: student.tuyen_duong || "Chưa phân tuyến",
        route_id: student.current_route_id,
        station: student.tram_don || "Chưa chọn trạm",
        stop_id: student.current_stop_id,
        username: student.username,
        password: student.password,
        parentName: student.ten_phu_huynh,
        contact: student.sdt_phu_huynh,
        parentEmail: student.email_phu_huynh,
        address: student.dia_chi,
      }));
      setStudents(mappedStudents);
    } catch (error) {
      console.error("Error loading students:", error);
      alert(
        "Không thể tải dữ liệu học sinh. Vui lòng kiểm tra kết nối backend."
      );
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const data = await RouteService.getRoutesForStudent();
      setRoutes(data);
    } catch (error) {
      console.error("Error loading routes:", error);
    }
  };

  const loadStops = async () => {
    try {
      const data = await RouteService.getAllStops();
      setStops(data);
    } catch (error) {
      console.error("Error loading stops:", error);
    }
  };

  const loadStopsByRoute = async (routeId) => {
    if (!routeId) {
      setFilteredStops([]);
      return;
    }
    try {
      const data = await RouteService.getStopsByRoute(routeId);
      setFilteredStops(data);
    } catch (error) {
      console.error("Error loading stops for route:", error);
      setFilteredStops([]);
    }
  };

  const handleRouteChangeInAdd = async (routeId) => {
    setNewStudent({
      ...newStudent,
      route_id: routeId,
      stop_id: "", // Reset stop khi đổi tuyến
    });
    await loadStopsByRoute(routeId);
  };

  const handleRouteChangeInEdit = async (routeId) => {
    setEditedStudent({
      ...editedStudent,
      route_id: routeId,
      stop_id: "", // Reset stop khi đổi tuyến
    });
    await loadStopsByRoute(routeId);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa học sinh này?")) {
      return;
    }
    try {
      await StudentService.deleteStudent(id);
      alert("Đã xóa học sinh thành công!");
      await loadStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Không thể xóa học sinh. Vui lòng thử lại!");
    }
  };

  const handleInfo = (id) => {
    const student = students.find((s) => s.id === id);
    if (student) {
      setSelectedStudent(student);
      setEditedStudent({ ...student });
      setIsEditMode(false);
      setShowInfoModal(true);
      // Load stops cho route hiện tại
      if (student.route_id) {
        loadStopsByRoute(student.route_id);
      }
    }
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        studentName: editedStudent.fullname,
        class: editedStudent.class,
        dob: editedStudent.dob,
        gender: editedStudent.gender,
        teacher: editedStudent.teacher,
        routeId: editedStudent.route_id,
        stopId: editedStudent.stop_id,
        username: editedStudent.username,
        password: editedStudent.password,
        parentName: editedStudent.parentName,
        parentPhone: editedStudent.contact,
        parentEmail: editedStudent.parentEmail,
        address: editedStudent.address,
      };
      await StudentService.updateStudent(editedStudent.id, payload);
      alert("Đã cập nhật thông tin học sinh!");
      await loadStudents();
      setIsEditMode(false);
      setShowInfoModal(false);
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Không thể cập nhật thông tin. Vui lòng thử lại!");
    }
  };

  const handleAdd = () => {
    setShowAddModal(true);
    setAddStep(1);
    setFilteredStops([]); // Reset filtered stops
    setNewStudent({
      fullname: "",
      dob: "",
      gender: "Nam",
      class: "",
      teacher: "",
      route_id: "",
      stop_id: "",
      parentName: "",
      contact: "",
      parentEmail: "",
      address: "",
    });
    setAccountInfo({
      username: "",
      password: "",
    });
  };

  const handleNextStep = () => {
    if (addStep === 1) {
      if (
        !newStudent.fullname ||
        !newStudent.parentName ||
        !newStudent.contact
      ) {
        alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
        return;
      }
      setAddStep(2);
    }
  };

  const handleCreateStudent = async () => {
    if (!accountInfo.password) {
      alert("Vui lòng điền mật khẩu cho tài khoản phụ huynh!");
      return;
    }

    try {
      const payload = {
        parentName: newStudent.parentName,
        parentPhone: newStudent.contact,
        parentEmail: newStudent.parentEmail,
        address: newStudent.address,
        password: accountInfo.password,
        studentName: newStudent.fullname,
        class: newStudent.class,
        dob: newStudent.dob,
        gender: newStudent.gender,
        teacher: newStudent.teacher,
        routeId: newStudent.route_id,
        stopId: newStudent.stop_id,
      };

      await StudentService.createStudent(payload);
      alert(`Đã thêm học sinh ${newStudent.fullname} thành công!`);
      setShowAddModal(false);
      await loadStudents();
    } catch (error) {
      console.error("Error creating student:", error);
      alert("Không thể thêm học sinh. Vui lòng thử lại!");
    }
  };

  const filtered = students.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      s.fullname.toLowerCase().includes(q) ||
      s.route.toLowerCase().includes(q) ||
      s.contact.includes(q)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / studentsPerPage);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filtered.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );

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
    <div className="student-page">
      <Header title="Học sinh" />

      <div className="student-content">
        <div className="student-controls">
          <button className="add-student-btn" onClick={handleAdd}>
            Thêm học sinh mới
          </button>
          <input
            className="search-student-input"
            placeholder="Tìm kiếm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="student-table">
          <div className="student-table-header">
            <div className="student-col student-col-code">Mã</div>
            <div className="student-col student-col-name">Họ và tên</div>
            <div className="student-col student-col-route">Tuyến đường</div>
            <div className="student-col student-col-station">
              Trạm lên/ xuống
            </div>
            <div className="student-col student-col-parent">Tên phụ huynh</div>
            <div className="student-col student-col-contact">
              Thông tin liên hệ
            </div>
            <div className="student-col student-col-actions">Thao tác</div>
          </div>

          {currentStudents.map((student, index) => (
            <div className="student-table-row" key={index}>
              <div className="student-col student-col-code">{student.code}</div>
              <div className="student-col student-col-name">
                {student.fullname}
              </div>
              <div className="student-col student-col-route">
                {student.route}
              </div>
              <div className="student-col student-col-station">
                {student.station}
              </div>
              <div className="student-col student-col-parent">
                {student.parentName}
              </div>
              <div className="student-col student-col-contact">
                {student.contact}
              </div>
              <div className="student-col student-col-actions">
                <button
                  className="student-info-btn"
                  onClick={() => handleInfo(student.id)}
                  title="Thông tin"
                >
                  <img src="/icons/infor.png" alt="Info" />
                </button>
                <button
                  className="student-delete-btn"
                  onClick={() => handleDelete(student.id)}
                  title="Xóa"
                >
                  <img src="/icons/delete.png" alt="Delete" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="student-no-results">Không có học sinh phù hợp.</div>
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

      {/* Modal thêm học sinh */}
      {showAddModal && (
        <div
          className="student-modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            {addStep === 1 ? (
              <>
                <h2 className="student-modal-title">Thêm học sinh mới</h2>
                <div className="add-student-container">
                  <div className="student-avatar-section">
                    <div className="student-avatar-circle">
                      <svg
                        viewBox="0 0 24 24"
                        fill="#10b981"
                        width="48"
                        height="48"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <p className="student-avatar-label">Học sinh mới</p>
                  </div>

                  <div className="student-form">
                    <div className="student-form-row">
                      <label>
                        <span className="required">*</span> Họ và tên:
                      </label>
                      <input
                        type="text"
                        value={newStudent.fullname}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            fullname: e.target.value,
                          })
                        }
                        placeholder="Nguyễn Văn A"
                      />
                    </div>

                    <div className="student-form-row">
                      <div className="birday-student-add-new">
                        {" "}
                        <label>Ngày Sinh:</label>
                        <input
                          type="date"
                          value={newStudent.dob}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              dob: e.target.value,
                            })
                          }
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                      <div className="student-gender-section">
                        <label>Giới tính:</label>
                        <div className="student-gender-group">
                          <label className="student-radio-label">
                            <input
                              type="radio"
                              name="gender"
                              value="Nam"
                              checked={newStudent.gender === "Nam"}
                              style={{ accentColor: "black" }}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  gender: e.target.value,
                                })
                              }
                            />
                            Nam
                          </label>
                          <label className="student-radio-label">
                            <input
                              type="radio"
                              name="gender"
                              value="Nữ"
                              checked={newStudent.gender === "Nữ"}
                              style={{ accentColor: "black" }}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  gender: e.target.value,
                                })
                              }
                            />
                            Nữ
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="student-form-row">
                      <label>Lớp:</label>
                      <input
                        type="text"
                        value={newStudent.class}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            class: e.target.value,
                          })
                        }
                        placeholder="12A4"
                      />
                    </div>

                    <div className="student-form-row">
                      <label>GVCN:</label>
                      <input
                        type="text"
                        value={newStudent.teacher}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            teacher: e.target.value,
                          })
                        }
                        placeholder="Nguyễn Thị C"
                      />
                    </div>

                    <div className="student-form-row">
                      <label>Tuyến đường:</label>
                      <select
                        className="student-select-input"
                        value={newStudent.route_id}
                        onChange={(e) => handleRouteChangeInAdd(e.target.value)}
                      >
                        <option value="">-- Chọn tuyến --</option>
                        {routes.map((route) => (
                          <option key={route.id} value={route.id}>
                            {route.routeName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="student-form-row">
                      <label>Trạm lên/xuống:</label>
                      <select
                        className="student-select-input"
                        value={newStudent.stop_id}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            stop_id: e.target.value,
                          })
                        }
                        disabled={!newStudent.route_id}
                      >
                        <option value="">-- Chọn trạm --</option>
                        {filteredStops.map((stop) => (
                          <option key={stop.id} value={stop.id}>
                            {stop.stopName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="student-form-row">
                      <label>
                        <span className="required">*</span> Họ tên phụ huynh:
                      </label>
                      <input
                        type="text"
                        value={newStudent.parentName}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            parentName: e.target.value,
                          })
                        }
                        placeholder="Nguyễn Văn B"
                      />
                    </div>

                    <div className="student-form-row">
                      <label>
                        <span className="required">*</span> Số điện thoại phụ
                        huynh:
                      </label>
                      <input
                        type="tel"
                        value={newStudent.contact}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            contact: e.target.value,
                          })
                        }
                        placeholder="0987654321"
                      />
                    </div>

                    <div className="student-form-row">
                      <label>Email phụ huynh:</label>
                      <input
                        type="email"
                        value={newStudent.parentEmail}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            parentEmail: e.target.value,
                          })
                        }
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="student-form-row">
                      <label>Địa chỉ:</label>
                      <input
                        type="text"
                        value={newStudent.address}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            address: e.target.value,
                          })
                        }
                        placeholder="Quận 1, TP.HCM"
                      />
                    </div>
                  </div>
                </div>

                <div className="student-modal-actions">
                  <button
                    className="student-btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="student-btn-primary"
                    onClick={handleNextStep}
                  >
                    Tiếp theo
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="student-modal-title">Tạo tài khoản phụ huynh</h2>
                <div className="student-avatar-section">
                  <div className="student-avatar-circle">
                    <svg
                      viewBox="0 0 24 24"
                      fill="#10b981"
                      width="48"
                      height="48"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <p className="student-avatar-label">Học sinh mới</p>
                </div>

                <div className="student-form">
                  <div className="student-form-row">
                    <label>
                      <span className="required">*</span> Tài khoản phụ huynh:
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

                  <div className="student-form-row">
                    <label>
                      <span className="required">*</span> Mật khẩu:
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

                <div className="student-modal-actions">
                  <button
                    className="student-btn-secondary"
                    onClick={() => setAddStep(1)}
                  >
                    Quay lại
                  </button>
                  <button
                    className="student-btn-primary"
                    onClick={handleCreateStudent}
                  >
                    Tạo tài khoản
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal xem/chỉnh sửa thông tin học sinh */}
      {showInfoModal && selectedStudent && (
        <div
          className="student-modal-overlay"
          onClick={() => {
            setShowInfoModal(false);
            setIsEditMode(false);
          }}
        >
          <div
            className="student-info-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="student-info-header">
              <div className="student-info-avatar">
                <img
                  src="image/avata.png"
                  alt={selectedStudent.fullname}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              </div>
              <div>
                <h2 className="student-info-name">
                  {isEditMode
                    ? "Chỉnh Sửa Thông Tin"
                    : selectedStudent.fullname}
                </h2>
              </div>
            </div>

            <div className="student-info-content">
              <div className="student-info-left">
                <div className="student-info-field">
                  <label>Ngày Sinh:</label>
                  {isEditMode ? (
                    <input
                      type="date"
                      value={editedStudent.dob}
                      onChange={(e) =>
                        setEditedStudent({
                          ...editedStudent,
                          dob: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{selectedStudent.dob}</span>
                  )}
                  <div className="student-info-field">
                    <label>Giới tính:</label>
                    {isEditMode ? (
                      <div className="driver-gender-group">
                        <label className="driver-radio-label">
                          <input
                            type="radio"
                            name="edit-gender"
                            value="Nam"
                            checked={editedStudent.gender === "Nam"}
                            style={{ accentColor: "black" }}
                            onChange={(e) =>
                              setEditedStudent({
                                ...editedStudent,
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
                            checked={editedStudent.gender === "Nữ"}
                            style={{ accentColor: "black" }}
                            onChange={(e) =>
                              setEditedStudent({
                                ...editedStudent,
                                gender: e.target.value,
                              })
                            }
                          />
                          Nữ
                        </label>
                      </div>
                    ) : (
                      <span>{selectedStudent.gender}</span>
                    )}
                  </div>
                </div>

                <div className="student-info-field">
                  <label>Lớp:</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedStudent.class}
                      onChange={(e) =>
                        setEditedStudent({
                          ...editedStudent,
                          class: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{selectedStudent.class}</span>
                  )}
                  <div className="student-info-field">
                    <label>GVCN:</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedStudent.teacher}
                        onChange={(e) =>
                          setEditedStudent({
                            ...editedStudent,
                            teacher: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span>{selectedStudent.teacher}</span>
                    )}
                  </div>
                </div>

                <div className="student-info-field">
                  <label>Tuyến đường:</label>
                  {isEditMode ? (
                    <select
                      className="student-select-input"
                      value={editedStudent.route_id}
                      onChange={(e) => handleRouteChangeInEdit(e.target.value)}
                    >
                      <option value="">-- Chọn tuyến --</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.routeName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{selectedStudent.route}</span>
                  )}
                </div>

                <div className="student-info-field">
                  <label>Trạm lên/xuống:</label>
                  {isEditMode ? (
                    <select
                      className="student-select-input"
                      value={editedStudent.stop_id}
                      onChange={(e) =>
                        setEditedStudent({
                          ...editedStudent,
                          stop_id: e.target.value,
                        })
                      }
                      disabled={!editedStudent.route_id}
                    >
                      <option value="">-- Chọn trạm --</option>
                      {filteredStops.map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.stopName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{selectedStudent.station}</span>
                  )}
                </div>

                <div className="student-info-field">
                  <label>Họ tên phụ huynh:</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedStudent.parentName}
                      onChange={(e) =>
                        setEditedStudent({
                          ...editedStudent,
                          parentName: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{selectedStudent.parentName}</span>
                  )}
                </div>

                <div className="student-info-field">
                  <label>Số điện thoại phụ huynh:</label>
                  {isEditMode ? (
                    <input
                      type="tel"
                      value={editedStudent.contact}
                      onChange={(e) =>
                        setEditedStudent({
                          ...editedStudent,
                          contact: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{selectedStudent.contact}</span>
                  )}
                </div>

                <div className="student-info-field">
                  <label>Email phụ huynh:</label>
                  {isEditMode ? (
                    <input
                      type="email"
                      value={editedStudent.parentEmail}
                      onChange={(e) =>
                        setEditedStudent({
                          ...editedStudent,
                          parentEmail: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{selectedStudent.parentEmail}</span>
                  )}
                </div>

                <div className="student-info-field">
                  <label>Địa chỉ:</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedStudent.address}
                      onChange={(e) =>
                        setEditedStudent({
                          ...editedStudent,
                          address: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{selectedStudent.address}</span>
                  )}
                </div>
              </div>

              <div className="student-info-right">
                <div className="student-account-fields">
                  <h3>Tài khoản phụ huynh</h3>

                  <div className="student-info-field">
                    <label>Tài khoản:</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={
                          editedStudent.username ||
                          "student" + editedStudent.code
                        }
                        onChange={(e) =>
                          setEditedStudent({
                            ...editedStudent,
                            username: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span>
                        {selectedStudent.username ||
                          "student" + selectedStudent.code}
                      </span>
                    )}
                  </div>

                  <div className="student-info-field">
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
                          value={editedStudent.password || ""}
                          onChange={(e) =>
                            setEditedStudent({
                              ...editedStudent,
                              password: e.target.value,
                            })
                          }
                          style={{ flex: 1 }}
                        />
                      ) : (
                        <span style={{ flex: 1 }}>
                          {showPassword
                            ? selectedStudent.password || "123456"
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

            <div className="student-info-actions">
              {isEditMode ? (
                <button
                  className="student-btn-primary"
                  onClick={handleSaveEdit}
                >
                  Cập nhật
                </button>
              ) : (
                <button className="student-btn-edit" onClick={handleEditToggle}>
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
    </div>
  );
}
