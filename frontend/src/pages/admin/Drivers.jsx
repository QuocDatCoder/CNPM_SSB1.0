import React, { useState, useEffect } from "react";
import "./Drivers.css";
import driversData from "../../data/drivers";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Simulate fetching data from a local file
    setDrivers(driversData);
  }, []);

  const filtered = drivers.filter((d) => {
    const q = query.toLowerCase();
    return (
      d.code.toLowerCase().includes(q) ||
      d.fullname.toLowerCase().includes(q) ||
      d.phone.includes(q)
    );
  });

  return (
    <div className="drivers-page">
      <div className="drivers-header">
        <img className="header-image" src="../icons/header.png" alt="header" />
      </div>
      <div className="drivers-controls">
        <button className="add-btn">Thêm tài xế mới</button>
        <input
          className="search-input"
          placeholder="Tìm kiếm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      <div className="drivers-table">
        <div className="table-head">
          <div className="col code">Mã</div>
          <div className="col name">Họ và tên</div>
          <div className="col dob">Ngày sinh</div>
          <div className="col phone">Số điện thoại</div>
          <div className="col actions">Thao tác</div>
        </div>

        {filtered.map((d, i) => (
          <div className="table-row" key={i}>
            <div className="col code">{d.code}</div>
            <div className="col name">{d.fullname}</div>
            <div className="col dob">{d.dob}</div>
            <div className="col phone">{d.phone}</div>
            <div className="col actions">
              <button className="info-btn">i</button>
              <button className="delete-btn"><img src="/icons/thungRac.svg" alt="Delete" /></button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="no-results">Không có tài xế phù hợp.</div>
        )}
      </div>
    </div>
  );
}
