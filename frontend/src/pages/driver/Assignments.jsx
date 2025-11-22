import React from "react";
import "./Assignments.css";
import weekSchedule from "../../data/schedules";

export default function Assignments() {
  return (
    <div className="assignments-page">
      <div className="assignments-header">
        <div className="week-select">
          <button className="week-btn">
            <span className="calendar-icon">📅</span>
            Tuần 8 [Từ ngày 20/10/2025 đến ngày 26/10/2025]
            <span className="chev">▾</span>
          </button>
        </div>

        <div className="assignments-actions">
          <button className="print-btn">In</button>
          <div className="week-nav">
            <button className="nav-btn">◀</button>
            <div className="week-indicator">Tuần 8</div>
            <button className="nav-btn">▶</button>
          </div>
        </div>
      </div>

      <div className="week-grid">
        {weekSchedule.map((col, idx) => (
          <div className="week-col" key={idx}>
            <div className="week-day">{col.day}</div>

            {col.slots && col.slots.length ? (
              col.slots.map((s, si) => (
                <div
                  key={si}
                  className={`slot ${s.type === "go" ? "go-slot" : "back-slot"}`}
                >
                  <div className="slot-time">{s.route} — Thời gian: {s.start}–{s.end}</div>
                </div>
              ))
            ) : (
              <div className="slot empty-slot"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
