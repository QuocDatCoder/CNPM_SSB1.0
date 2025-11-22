import React, { useState, useEffect } from "react";
import Header from "../../components/common/Header/header";
import "./Student.css";
import studentsData from "../../data/students";

export default function Student() {
  const [students, setStudents] = useState([]);
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
  const [newStudent, setNewStudent] = useState({
    fullname: "",
    dob: "",
    gender: "Nam",
    class: "",
    teacher: "",
    route: "",
    station: "",
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
    setStudents(studentsData);
  }, []);

  const handleDelete = (id) => {
    console.log("Delete student:", id);
  };

  const handleInfo = (code) => {
    const student = students.find((s) => s.code === code);
    if (student) {
      setSelectedStudent(student);
      setEditedStudent({ ...student });
      setIsEditMode(false);
      setShowInfoModal(true);
    }
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSaveEdit = () => {
    setStudents(
      students.map((s) => (s.code === editedStudent.code ? editedStudent : s))
    );
    setSelectedStudent(editedStudent);
    setIsEditMode(false);
    alert("Đã cập nhật thông tin học sinh!");
  };

  const handleAdd = () => {
    setShowAddModal(true);
    setAddStep(1);
    setNewStudent({
      fullname: "",
      dob: "",
      gender: "Nam",
      class: "",
      teacher: "",
      route: "",
      station: "",
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

  const handleCreateStudent = () => {
    if (!accountInfo.username || !accountInfo.password) {
      alert("Vui lòng điền đầy đủ thông tin tài khoản!");
      return;
    }

    const newCode = String(students.length + 1).padStart(4, "0");

    const studentToAdd = {
      code: newCode,
      ...newStudent,
      username: accountInfo.username,
      password: accountInfo.password,
    };

    setStudents([...students, studentToAdd]);
    alert(
      `Đã thêm học sinh ${newStudent.fullname} với tài khoản ${accountInfo.username}!`
    );
    setShowAddModal(false);
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
                  onClick={() => handleInfo(student.code)}
                  title="Thông tin"
                >
                  <img src="/icons/infor.png" alt="Info" />
                </button>
                <button
                  className="student-delete-btn"
                  onClick={() => handleDelete(student.code)}
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
                      <label>Trạm lên/xuống:</label>
                      <input
                        type="text"
                        value={newStudent.station}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            station: e.target.value,
                          })
                        }
                        placeholder="ĐH Sài Gòn"
                      />
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
                  <label>Trạm lên/xuống:</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedStudent.station}
                      onChange={(e) =>
                        setEditedStudent({
                          ...editedStudent,
                          station: e.target.value,
                        })
                      }
                    />
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
