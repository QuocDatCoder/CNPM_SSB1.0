import React, { useState } from "react";
import "./Students.css";

const sampleStudents = [
  {
    code: "0001",
    name: "An Dương Vương",
    class: "1",
    stop: "Nguyễn Văn A",
    contact: "0901122334",
    status: "Chưa lên xe",
  },
  {
    code: "0002",
    name: "Lê Thị B",
    class: "2",
    stop: "Trần Văn B",
    contact: "0912345678",
    status: "Đã lên xe",
  },
  {
    code: "0003",
    name: "Võ Văn C",
    class: "1",
    stop: "Cổng trường C",
    contact: "0977555999",
    status: "Chưa lên xe",
  },
];

export default function Students() {
  const [mode, setMode] = useState("go"); // 'go' = Đưa đi, 'back' = Đưa về
  const [students, setStudents] = useState(sampleStudents);

  function toggleStatus(index) {
    setStudents((prev) => {
      const copy = [...prev];
      const s = copy[index];
      if (s.status === "Đã lên xe") s.status = mode === "go" ? "Đã đi" : "Đã về";
      else s.status = "Đã lên xe";
      return copy;
    });
  }

  return (
    <div className="students-page">
      <div className="students-header">
        <h3>Danh sách học sinh</h3>
        <div className="students-controls">
          <button className={`mode-btn ${mode === "go" ? "active" : ""}`} onClick={() => setMode("go")}>
            Đưa đi
          </button>
          <button className={`mode-btn ${mode === "back" ? "active" : ""}`} onClick={() => setMode("back")}>
            Đưa về
          </button>
        </div>
      </div>

      <div className="students-table">
        <div className="table-head">
          <div>Mã HS</div>
          <div>Họ và tên học sinh</div>
          <div>Lớp</div>
          <div>Trạm đón</div>
          <div>Thông tin liên hệ</div>
          <div>Trạng thái</div>
          <div>Thao tác</div>
        </div>

        <div className="table-body">
          {students.map((s, idx) => (
            <div className="table-row" key={s.code}>
              <div>{s.code}</div>
              <div>{s.name}</div>
              <div>{s.class}</div>
              <div>{s.stop}</div>
              <div>{s.contact}</div>
              <div className={`status ${s.status === "Đã lên xe" || s.status === "Đã đi" || s.status === "Đã về" ? "ok" : "pending"}`}>
                {s.status}
              </div>
              <div>
                <button className="action-btn" onClick={() => toggleStatus(idx)}>
                  {s.status === "Đã lên xe" || s.status === "Đã đi" || s.status === "Đã về" ? "Huỷ" : "Đánh dấu"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
