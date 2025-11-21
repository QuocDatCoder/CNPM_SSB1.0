import React from "react";

export default function Assignments() {
  return (
    <div className="driver-assignments">
      <h3>Lịch phân công</h3>
      <p>Hiển thị lịch phân công đưa/đón cho tài xế ở đây.</p>
      <table className="assignments-table">
        <thead>
          <tr>
            <th>Tuyến</th>
            <th>Thời gian</th>
            <th>Ngày</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tuyến 1</td>
            <td>06:00 - 07:30</td>
            <td>Hàng ngày</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
