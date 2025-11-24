import React, { useState, useRef, useEffect } from "react";
import "./Assignments.css";
import weekSchedule from "../../data/schedules";

export default function Assignments() {
  const weeks = [
    { id: 6, label: "Tuần 6", range: "Từ ngày 06/10/2025 đến ngày 12/10/2025" },
    { id: 7, label: "Tuần 7", range: "Từ ngày 13/10/2025 đến ngày 19/10/2025" },
    { id: 8, label: "Tuần 8", range: "Từ ngày 20/10/2025 đến ngày 26/10/2025" },
    { id: 9, label: "Tuần 9", range: "Từ ngày 27/10/2025 đến ngày 02/11/2025" },
    { id: 10, label: "Tuần 10", range: "Từ ngày 03/11/2025 đến ngày 09/11/2025" },
  ];

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(2); // default Tuần 8
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const prevWeek = () => setSelectedWeekIndex((i) => Math.max(0, i - 1));
  const nextWeek = () => setSelectedWeekIndex((i) => Math.min(weeks.length - 1, i + 1));

  const selectedWeek = weeks[selectedWeekIndex];

  return (
    <div className="assignments-page">
      <div className="assignments-header">
        <div className="week-select">
          <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
            <button className="week-btn" onClick={() => setOpen((v) => !v)}>
              <span className="calendar-icon">📅</span>
              {selectedWeek.label} [{selectedWeek.range}]
              <span className="chev">▾</span>
            </button>

            {open && (
              <div className="week-dropdown">
                {weeks.map((w, i) => (
                  <button
                    key={w.id}
                    className={`week-option ${i === selectedWeekIndex ? "active" : ""}`}
                    onClick={() => {
                      setSelectedWeekIndex(i);
                      setOpen(false);
                    }}
                  >
                    <div className="week-option-label">{w.label}</div>
                    <div className="week-option-range">{w.range}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="assignments-actions">
          <button className="print-btn">In</button>
          <div className="week-nav">
            <button className="nav-btn" onClick={prevWeek}>◀</button>
            <div className="week-indicator">{selectedWeek.label}</div>
            <button className="nav-btn" onClick={nextWeek}>▶</button>
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
