import React, { useState, useEffect } from "react";
import "./Students.css";
import StudentService from "../../services/student.service";
import ScheduleService from "../../services/schedule.service";

export default function Students() {
  const [mode, setMode] = useState("go"); // 'go' = Lượt đi (Đón), 'back' = Lượt về (Trả)
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [availableTypes, setAvailableTypes] = useState({
    go: false,
    back: false,
  }); // Kiểm tra tuyến nào available

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  // Fetch tất cả lịch hôm nay để check loại tuyến nào có
  useEffect(() => {
    const checkAvailableTypes = async () => {
      try {
        const schedules = await ScheduleService.getMySchedule();
        console.log("📅 All schedules:", schedules);

        // Kiểm tra hôm nay có những tuyến nào
        const today = new Date().toISOString().split("T")[0];
        const todaySchedules = schedules[today] || [];

        const hasGo = todaySchedules.some((s) => s.type === "morning");
        const hasBack = todaySchedules.some((s) => s.type === "afternoon");

        setAvailableTypes({ go: hasGo, back: hasBack });

        // Mặc định chọn tuyến có sẵn
        if (hasGo && !hasBack) {
          setMode("go");
        } else if (!hasGo && hasBack) {
          setMode("back");
        }
      } catch (err) {
        console.error("Error checking available types:", err);
      }
    };

    checkAvailableTypes();
  }, []);

  // Map trạng thái từ API sang UI
  const getStatusDisplay = (apiStatus, mode) => {
    if (mode === "go") {
      // Lượt đi: choxacnhan -> dihoc -> vangmat
      if (apiStatus === "choxacnhan") return "Chờ xác nhận";
      if (apiStatus === "dihoc") return "Đang di học";
      if (apiStatus === "vangmat") return "Vắng mặt";
    } else {
      // Lượt về: choxacnhan -> daxuong
      if (apiStatus === "choxacnhan") return "Chờ xác nhận";
      if (apiStatus === "daxuong") return "Đã xuống xe";
    }
    return apiStatus;
  };

  // Map UI status sang API status
  const getNextStatus = (currentStatus, mode) => {
    if (mode === "go") {
      if (currentStatus === "choxacnhan") return "dihoc";
      if (currentStatus === "dihoc") return "vangmat";
      if (currentStatus === "vangmat") return "dihoc"; // Toggle back
    } else {
      if (currentStatus === "choxacnhan") return "daxuong";
      if (currentStatus === "daxuong") return "choxacnhan"; // Toggle back
    }
    return currentStatus;
  };

  // Fetch danh sách học sinh từ API theo loai_tuyen
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        // Map mode sang loai_tuyen
        const loaiTuyen = mode === "go" ? "luot_di" : "luot_ve";

        const response = await StudentService.getCurrentScheduleStudents(
          loaiTuyen
        );
        console.log("📚 Students response:", response);

        if (response.current_schedule) {
          setCurrentSchedule(response.current_schedule);
        }

        if (response.students && Array.isArray(response.students)) {
          const formattedStudents = response.students.map((s) => ({
            ...s,
            student_id: s.student_id,
            schedule_id: s.schedule_id,
            fullname: s.ho_ten_hs || s.name || "",
            class: s.lop || "",
            parent: s.phu_huynh || "",
            phone: s.sdt_ph || "",
            stop: s.ten_tram || "",
            address: s.dia_chi_tram || "",
            coordinates: s.toa_do || [0, 0],
            order: s.thu_tu_don || 0,
            status: s.trang_thai || "choxacnhan", // API status
          }));
          setStudents(formattedStudents);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Không thể tải danh sách học sinh");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [mode]);

  // Toggle trạng thái học sinh
  const toggleStatus = async (studentId) => {
    try {
      const student = students.find((s) => s.student_id === studentId);
      if (!student) return;

      const nextStatus = getNextStatus(student.status, mode);

      // Cập nhật UI trước
      setStudents((prev) =>
        prev.map((s) => {
          if (s.student_id !== studentId) return s;
          return { ...s, status: nextStatus };
        })
      );

      // Call API để lưu trạng thái
      await StudentService.updateStudentStatus(
        student.schedule_id,
        studentId,
        nextStatus
      );

      console.log(`✅ Updated student ${studentId} status to ${nextStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      // Revert UI nếu API thất bại
      setStudents((prev) =>
        prev.map((s) => {
          if (s.student_id !== studentId) return s;
          return { ...s, status: s.status };
        })
      );
    }
  };

  const getStatusButtonClass = (status) => {
    if (status === "choxacnhan") return "pending";
    if (status === "dihoc" || status === "daxuong") return "ok";
    if (status === "vangmat") return "absent";
    return "pending";
  };

  // Sắp xếp học sinh theo thứ tự đón
  const sortedStudents = [...students].sort((a, b) => a.order - b.order);

  return (
    <div className="students-page">
      <div className="students-content">
        <div className="students-header">
          <h3>
            Danh sách học sinh -{" "}
            {mode === "go" ? "Lượt đi (Đón)" : "Lượt về (Trả)"}
          </h3>
          <div className="students-controls">
            <button
              className={`mode-btn ${mode === "go" ? "active" : ""}`}
              onClick={() => setMode("go")}
              disabled={!availableTypes.go}
              title={!availableTypes.go ? "Hôm nay không có lượt đi" : ""}
            >
              Đón
            </button>
            <button
              className={`mode-btn ${mode === "back" ? "active" : ""}`}
              onClick={() => setMode("back")}
              disabled={!availableTypes.back}
              title={!availableTypes.back ? "Hôm nay không có lượt về" : ""}
            >
              Trả
            </button>
          </div>
        </div>

        {currentSchedule && (
          <div
            className={`current-schedule-info ${
              currentSchedule.loai_tuyen === "luot_di" ? "go" : "back"
            }`}
          >
            <span className="schedule-type">
              {currentSchedule.loai_tuyen === "luot_di" ? "Lượt đi" : "Lượt về"}
              - {currentSchedule.gio_bat_dau}
            </span>
            <span className={`schedule-status ${currentSchedule.trang_thai}`}>
              {currentSchedule.trang_thai === "dangchay"
                ? "Đang chạy"
                : currentSchedule.trang_thai === "hoanthanh"
                ? "Đã hoàn thành"
                : "Chưa bắt đầu"}
            </span>
          </div>
        )}

        <div className="students-table">
          <div className="table-head">
            <div>STT</div>
            <div>Họ và tên học sinh</div>
            <div>Lớp</div>
            <div>Phụ huynh</div>
            <div>Trạm đón</div>
            <div>Liên hệ</div>
            <div>Trạng thái</div>
          </div>

          <div className="table-body">
            {loading ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                Đang tải danh sách...
              </div>
            ) : error ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "20px",
                  textAlign: "center",
                  color: "red",
                }}
              >
                {error}
              </div>
            ) : sortedStudents.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "20px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                Không có học sinh trong chuyến này
              </div>
            ) : (
              sortedStudents.map((s, idx) => (
                <div className="table-row" key={s.student_id}>
                  <div>{s.order}</div>
                  <div>{s.fullname}</div>
                  <div>{s.class}</div>
                  <div>{s.parent}</div>
                  <div>
                    <div className="stop-info">
                      <div className="stop-name">{s.stop}</div>
                      <div className="stop-address">{s.address}</div>
                    </div>
                  </div>
                  <div>{s.phone}</div>
                  <div>
                    <button
                      type="button"
                      className={`status-btn ${getStatusButtonClass(s.status)}`}
                      onClick={() => toggleStatus(s.student_id)}
                    >
                      {getStatusDisplay(s.status, mode)}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
