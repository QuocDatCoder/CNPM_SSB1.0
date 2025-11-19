import React, { useState, useEffect } from "react";
import Header from "../../components/common/Header/header";
import "./Student.css";
import studentsData from "../../data/students";

export default function Student() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setStudents(studentsData);
  }, []);

  const handleDelete = (id) => {
    console.log("Delete student:", id);
  };

  const handleInfo = (id) => {
    console.log("View student info:", id);
  };

  const handleAdd = () => {
    console.log("Add new student");
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

  return (
    <div className="student-page">
      <Header title="Học sinh" />

      <div className="student-content">
        <div className="student-controls">
          <button className="add-student-btn" onClick={handleAdd}>
            Thêm tài xế mới
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

          {filtered.map((student, index) => (
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
      </div>
    </div>
  );
}
