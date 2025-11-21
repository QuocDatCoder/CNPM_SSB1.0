import React from "react";

const mockStudents = [
  { id: 1, name: "Nguyễn Văn A", stop: "Cổng trường A" },
  { id: 2, name: "Trần Thị B", stop: "Cổng trường B" },
];

export default function Students() {
  return (
    <div className="driver-students">
      <h3>Danh sách học sinh</h3>
      <ul className="student-list">
        {mockStudents.map((s) => (
          <li key={s.id} className="student-item">
            <strong>{s.name}</strong> — Điểm đón: {s.stop}
          </li>
        ))}
      </ul>
    </div>
  );
}
