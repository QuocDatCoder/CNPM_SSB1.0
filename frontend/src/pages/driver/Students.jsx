import React, { useState } from "react";
import "./Students.css";
import studentsData from "../../data/students";

export default function Students() {
  const [mode, setMode] = useState("go"); // 'go' = Đưa đi, 'back' = Đưa về
  const [students, setStudents] = useState(
    studentsData.map((s) => ({
      // keep original fields and add aliases expected by this component
      ...s,
      name: s.fullname || s.name || "",
      parent: s.parentName || s.parent || "",
      stop: s.station || s.route || s.stop || "",
      status: s.status || "Chưa đón",
    }))
  );
  // Toggle a student's status between 'Chưa đón' and 'Đang di chuyển'
  const toggleStatus = (code) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.code !== code) return s;
        const current = s.status;
        let next = current;
        if (current === "Chưa đón") next = "Đang di chuyển";
        else if (current === "Đang di chuyển") next = "Đã xuống xe";
        // if already a final state (Đã xuống xe or Đã đón), keep it
        return { ...s, status: next };
      })
    );
  };

  return (
    <div className="students-page">
      <div className="students-content">
        <div className="students-header">
          <h3>Danh sách học sinh</h3>
          <div className="students-controls">
            <button
              className={`mode-btn ${mode === "go" ? "active" : ""}`}
              onClick={() => setMode("go")}
            >
              Đón
            </button>
            <button
              className={`mode-btn ${mode === "back" ? "active" : ""}`}
              onClick={() => setMode("back")}
            >
              Trả
            </button>
          </div>
        </div>

        <div className="students-table">
          <div className="table-head">
            <div>Mã HS</div>
            <div>Họ và tên học sinh</div>
            <div>Phụ huynh</div>
            <div>Lớp</div>
            <div>Trạm đón</div>
            <div>Thông tin liên hệ</div>
            <div>Trạng thái</div>
          </div>

          <div className="table-body">
            {students.map((s, idx) => (
              <div className="table-row" key={s.code}>
                <div>{s.code}</div>
                <div>{s.name}</div>
                <div>{s.parent}</div>
                <div>{s.class}</div>
                <div>{s.stop}</div>
                <div>{s.contact}</div>
                <div>
                  <button
                    type="button"
                    className={`status-btn ${
                      s.status === "Chưa đón"
                        ? "pending"
                        : s.status === "Đang di chuyển"
                        ? "ok"
                        : "done"
                    }`}
                    onClick={() => toggleStatus(s.code)}
                    disabled={
                      s.status === "Đã xuống xe" || s.status === "Đã đón"
                    }
                  >
                    {s.status}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
