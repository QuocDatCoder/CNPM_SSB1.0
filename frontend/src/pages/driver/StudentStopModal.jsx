import React, { useState, useEffect } from "react";
import "./StudentStopModal.css";

export default function StudentStopModal({
  isOpen,
  stops,
  currentStopIndex,
  onClose,
  onUpdateStudentStatus,
  loading,
  scheduleType, // "morning" (lượt đi) hoặc "afternoon" (lượt về)
  resetTrigger, // Trigger để reset tất cả status về 'choxacnhan' khi bắt đầu chuyến mới
}) {
  const [selectedStop, setSelectedStop] = useState(null);
  const [studentStatuses, setStudentStatuses] = useState({}); // Lưu trạng thái tạm thời

  // Reset statuses khi chuyến đi mới bắt đầu
  useEffect(() => {
    if (resetTrigger !== undefined) {
      setStudentStatuses({});
    }
  }, [resetTrigger]);

  useEffect(() => {
    if (isOpen && stops && stops.length > 0) {
      const nearbyStop = stops.find((stop) => stop.isNearby);
      setSelectedStop(nearbyStop || stops[currentStopIndex] || stops[0]);

      // Initialize student statuses - tất cả default về 'choxacnhan'
      const statuses = {};
      const currentStop = nearbyStop || stops[currentStopIndex] || stops[0];
      if (currentStop.students) {
        currentStop.students.forEach((student) => {
          statuses[student.scheduleStudentId] = "choxacnhan"; // ✅ Luôn default
        });
      }
      setStudentStatuses(statuses);
    }
  }, [isOpen, stops, currentStopIndex]);

  if (!isOpen || !stops || stops.length === 0) return null;

  const currentStop = selectedStop || stops[currentStopIndex] || stops[0];
  const studentsAtStop = currentStop.students || [];

  // Trạng thái cho lượt đi (morning) - Chỉ 2 nút
  const morningStatuses = [
    { key: "dihoc", label: "Đi học", color: "#3b82f6" },
    { key: "vangmat", label: "Vắng mặt", color: "#ef4444" },
  ];

  // Trạng thái cho lượt về (afternoon) - Chỉ 2 nút
  const afternoonStatuses = [
    { key: "daxuong", label: "Đã xuống", color: "#10b981" },
    { key: "vangmat", label: "Vắng mặt", color: "#ef4444" },
  ];

  const availableStatuses =
    scheduleType === "morning" ? morningStatuses : afternoonStatuses;

  const handleStatusChange = (scheduleStudentId, newStatus) => {
    // Cập nhật UI ngay lập tức (optimistic update)
    setStudentStatuses((prev) => ({
      ...prev,
      [scheduleStudentId]: newStatus,
    }));

    // Gọi callback để cập nhật backend - không cần đợi response
    // UI đã update rồi nên tài xế sẽ thấy thay đổi ngay
    onUpdateStudentStatus(scheduleStudentId, newStatus);
  };

  return (
    <div className="student-stop-modal-overlay">
      <div className="student-stop-modal">
        <div className="student-stop-modal-header">
          <h2>Danh sách Học sinh</h2>
          <p className="student-stop-modal-subtitle">
            Quản lý trong thời đón/trả học sinh trên tuyến.
          </p>
          <button className="student-stop-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="student-stop-modal-content">
          {/* Stop Selector */}
          <div className="stop-selector">
            <label className="stop-selector-label">Chọn trạm:</label>
            <select
              value={currentStop.stopId || ""}
              onChange={(e) => {
                const stop = stops.find(
                  (s) => s.stopId === parseInt(e.target.value)
                );
                setSelectedStop(stop);
                // Update student statuses for new stop
                const statuses = {};
                if (stop.students) {
                  stop.students.forEach((student) => {
                    statuses[student.scheduleStudentId] =
                      student.trang_thai_don || "choxacnhan";
                  });
                }
                setStudentStatuses(statuses);
              }}
              className="stop-selector-input"
            >
              {stops.map((stop) => (
                <option key={stop.stopId} value={stop.stopId}>
                  {stop.stopOrder}. {stop.stopName}
                  {stop.isNearby ? " (Gần đây)" : ""}
                  {stop.distance !== undefined ? ` - ${stop.distanceText}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Stop Info */}
          <div className="stop-info">
            <div className="stop-info-item">
              <span className="stop-info-label">Tên trạm:</span>
              <span className="stop-info-value">{currentStop.stopName}</span>
            </div>
            <div className="stop-info-item">
              <span className="stop-info-label">Địa chỉ:</span>
              <span className="stop-info-value">{currentStop.stopAddress}</span>
            </div>
          </div>

          {/* Students List */}
          <div className="students-list-container">
            <h3 className="students-list-title">
              Danh sách học sinh ({studentsAtStop.length})
            </h3>

            {loading && (
              <div className="loading-state">
                <p>Đang tải...</p>
              </div>
            )}

            {!loading && studentsAtStop.length === 0 && (
              <div className="empty-state">
                <p>Không có học sinh tại trạm này</p>
              </div>
            )}

            {!loading && studentsAtStop.length > 0 && (
              <div className="students-grid">
                {studentsAtStop.map((student) => {
                  const currentStatus =
                    studentStatuses[student.scheduleStudentId] || "choxacnhan";
                  const statusInfo = availableStatuses.find(
                    (s) => s.key === currentStatus
                  );

                  return (
                    <div
                      key={student.scheduleStudentId}
                      className="student-card"
                    >
                      {/* Card Header with Status Badge */}
                      <div className="student-card-header">
                        <div className="student-id-section">
                          <span className="student-id">
                            #{student.studentId || "N/A"}
                          </span>
                        </div>
                        <div
                          className="student-status-badge"
                          style={{
                            backgroundColor: statusInfo?.color || "#6b7280",
                          }}
                        >
                          <span className="status-dot">●</span>
                          {statusInfo?.label || "Không xác định"}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="student-card-body">
                        <h4 className="student-name">{student.studentName}</h4>
                        <p className="student-class">
                          {student.className || "N/A"}
                        </p>

                        <div className="student-info-line">
                          <span className="info-icon">📍</span>
                          <span className="info-text">
                            {currentStop.stopName}
                          </span>
                        </div>

                        <div className="student-info-line">
                          <span className="info-icon">👤</span>
                          <span className="info-text">
                            {student.parentName || "N/A"}
                          </span>
                        </div>

                        <div className="student-info-line">
                          <span className="info-icon">📱</span>
                          <span className="info-text">
                            {student.parentPhone ||
                              student.studentPhone ||
                              "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer - Action Buttons */}
                      <div className="student-card-footer">
                        {availableStatuses.map((status) => (
                          <button
                            key={status.key}
                            className={`status-btn ${
                              currentStatus === status.key ? "active" : ""
                            }`}
                            style={{
                              backgroundColor:
                                currentStatus === status.key
                                  ? status.color
                                  : "#e5e7eb",
                              color:
                                currentStatus === status.key
                                  ? "white"
                                  : "#374151",
                            }}
                            onClick={() =>
                              handleStatusChange(
                                student.scheduleStudentId,
                                status.key
                              )
                            }
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="student-stop-modal-footer">
          <button className="btn-modal-action btn-continue" onClick={onClose}>
            ▶️ Bắt đầu đón
          </button>
          <button className="btn-modal-action btn-close" onClick={onClose}>
            ✕ Trở lại
          </button>
        </div>
      </div>
    </div>
  );
}
