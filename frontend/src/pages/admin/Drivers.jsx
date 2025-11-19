import React, { useState, useEffect } from "react";
import Header from "../../components/common/Header/header";
import "./Drivers.css";
import driversData from "../../data/drivers";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setDrivers(driversData);
  }, []);

  const handleDelete = (id) => {
    console.log("Delete driver:", id);
  };

  const handleInfo = (id) => {
    console.log("View driver info:", id);
  };

  const handleAdd = () => {
    console.log("Add new driver");
  };

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
            <div className="col col-actions">Thao tác</div>
          </div>

          {filtered.map((driver, index) => (
            <div className="table-row-driver" key={index}>
              <div className="col col-code">{driver.code}</div>
              <div className="col col-name">{driver.fullname}</div>
              <div className="col col-dob">{driver.dob}</div>
              <div className="col col-phone">{driver.phone}</div>
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
      </div>
    </div>
  );
}
