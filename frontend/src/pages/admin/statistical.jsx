import React, { useState } from "react";
import Header from "../../components/common/Header/header";
import "./statistical.css";

export default function Statistical() {
  const [tripData] = useState({
    chuyenDi: 65,
    chuyenVe: 65,
  });

  const total = tripData.chuyenDi + tripData.chuyenVe;
  const circumference = 2 * Math.PI * 70;
  const dashDi = (tripData.chuyenDi / total) * circumference;
  const dashVe = (tripData.chuyenVe / total) * circumference;

  const [weeklyData] = useState([
    { day: "Thứ 2", value: 4 },
    { day: "Thứ 3", value: 3 },
    { day: "Thứ 4", value: 7 },
    { day: "Thứ 5", value: 6 },
    { day: "Thứ 6", value: 4 },
    { day: "Thứ 7", value: 8 },
    { day: "Chủ nhật", value: 5 },
  ]);

  const maxValue = Math.max(...weeklyData.map((d) => d.value));

  return (
    <div className="statistical-page">
      <Header title="Thống kê" />

      <div className="statistical-content">
        {/* Cards */}
        <div className="stat-cards">
          <div className="stat-card stat-card-driver">
            <div className="stat-card-header">
              <span className="stat-title">Tài xế</span>
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </div>
            <div className="stat-value">5 người</div>
            <div className="stat-footer">
              <span className="stat-badge stat-badge-active">
                Đang hoạt động
              </span>
              <span className="stat-badge stat-badge-inactive">
                Không hoạt động
              </span>
            </div>
          </div>

          <div className="stat-card stat-card-route">
            <div className="stat-card-header">
              <span className="stat-title">Tuyến đường</span>
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                </svg>
              </div>
            </div>
            <div className="stat-value">12</div>
          </div>

          <div className="stat-card stat-card-bus">
            <div className="stat-card-header">
              <span className="stat-title">Xe bus</span>
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
                </svg>
              </div>
            </div>
            <div className="stat-value">8</div>
          </div>

          <div className="stat-card stat-card-customer">
            <div className="stat-card-header">
              <span className="stat-title">Khách hàng mới</span>
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
            </div>
            <div className="stat-value">120</div>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-row">
          {/* Pie Chart */}
          <div className="chart-container">
            <h3 className="chart-title">Số chuyến</h3>
            <div className="pie-chart">
              <svg viewBox="0 0 240 240">
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#4ECDC4"
                  strokeWidth="60"
                  strokeDasharray={`${dashDi} ${circumference}`}
                  transform="rotate(-90 100 100)"
                />

                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#FF9F43"
                  strokeWidth="60"
                  strokeDasharray={`${dashVe} ${circumference}`}
                  strokeDashoffset={`-${dashDi}`}
                  transform="rotate(-90 100 100)"
                />
              </svg>
            </div>
            <div className="pie-legend">
              <div className="legend-item">
                <span
                  className="legend-color"
                  style={{ backgroundColor: "#4ECDC4" }}
                ></span>
                <span>Chuyến đi</span>
              </div>
              <div className="legend-item">
                <span
                  className="legend-color"
                  style={{ backgroundColor: "#FF9F43" }}
                ></span>
                <span>Chuyến về</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="chart-container">
            <h3 className="chart-title">Số lượng các trạm trễ trong tuần</h3>
            <div className="bar-chart">
              {weeklyData.map((item, index) => (
                <div className="bar-item" key={index}>
                  <div className="bar-wrapper">
                    <div
                      className="bar"
                      style={{ height: `${(item.value / maxValue) * 100}%` }}
                    >
                      <span className="bar-value">{item.value}</span>
                    </div>
                  </div>
                  <span className="bar-label">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="chart-container chart-full">
          <h3 className="chart-title">Báo cáo sự cố</h3>
          <div className="line-chart">
            <svg viewBox="0 0 600 200" preserveAspectRatio="none">
              <polyline
                points="0,120 100,100 200,105 300,90 400,80 500,60 600,50"
                fill="none"
                stroke="#4A90E2"
                strokeWidth="3"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
