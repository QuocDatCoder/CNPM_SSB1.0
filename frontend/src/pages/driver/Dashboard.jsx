import React, { useState } from "react";
import Sidebar from "../../components/common/Sidebar/Sidebar";
import Assignments from "./Assignments";
import Students from "./Students";
import Notifications from "./Notifications";
import "./Dashboard.css";
import drivers from "../../data/drivers";

const driverMenu = [
	{ icon: "/icons/home.png", label: "Trang chủ" },
	{ icon: "/icons/schedule.png", label: "Xem lịch phân công" },
	{ icon: "/icons/student.png", label: "Danh sách học sinh" },
	{ icon: "/icons/message.png", label: "Thông báo" },
];

function Home() {
	const [showLogin, setShowLogin] = useState(false);
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = (e) => {
		e && e.preventDefault && e.preventDefault();
		// TODO: call auth API. For now just close modal.
		// You can replace this with real authentication logic.
		console.log("Login attempt", { phone, password });
		setShowLogin(false);
	};

	// pick first driver as current (replace with auth-based selection when available)
	const driver = drivers && drivers.length ? drivers[0] : {
		code: "0000",
		fullname: "Tên tài xế",
		avatar: "/image/logo2.png",
		phone: "",
		dob: "",
		address: "",
		email: "",
		licenseNumber: "",
		vehiclePlate: "",
	};

	const todaysRoutes = [
		{ id: 1, name: "Tuyến 1", time: "06:00", status: "Đang chạy", lastStop: "Đã đến điểm A" },
		{ id: 2, name: "Tuyến 2", time: "07:30", status: "Chưa chạy", lastStop: "Chưa bắt đầu" },
		{ id: 3, name: "Tuyến 3", time: "12:00", status: "Đã hoàn thành", lastStop: "Đã đến điểm C" },
	];

	return (
		<div className="driver-home">
			<div className="driver-banner">
				<img
					src="/image/header.png"
					alt="banner"
					className="driver-banner-image"
					onError={(e) => (e.currentTarget.src = "/image/neon-bus.jpg")}
				/>

				<div className="driver-login-box">
					<button className="login-trigger" onClick={() => setShowLogin(true)}>
						Đăng nhập
					</button>
				</div>
			</div>

			<div className="driver-home-grid">
				<div className="driver-info">
					<div className="avatar-wrap">
						<img
							src={driver.avatar}
							alt="avatar"
							className="driver-avatar"
							onError={(e) => (e.currentTarget.src = "/image/logo.png")}
						/>
					</div>
					<div className="driver-meta">
						<h3 className="driver-name">{driver.fullname}</h3>
						<p className="driver-id">Mã: {driver.code}</p>
						<p className="driver-phone">SĐT: {driver.phone}</p>
						<p className="driver-email">Email: {driver.email}</p>
						<p className="driver-license">Bằng lái: {driver.licenseNumber}</p>
						<p className="driver-vehicle">Biển số: {driver.vehiclePlate}</p>
					</div>
				</div>

				<div className="driver-routes">
					<h3>Tuyến hôm nay</h3>
					<ul className="routes-list">
						{todaysRoutes.map((r) => (
							<li key={r.id} className="route-item">
								<div className="route-left">
									<div className="route-name">{r.name}</div>
									<div className="route-time">{r.time}</div>
								</div>
								<div className="route-right">
									<span className={`route-status ${r.status.replace(/\s+/g, "-").toLowerCase()}`}>
										{r.status}
									</span>
									<div className="route-last">{r.lastStop}</div>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>

			{showLogin && (
				<div className="login-modal-overlay" onClick={() => setShowLogin(false)}>
					<div
						className="login-modal"
						onClick={(e) => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
					>
						<h3>Đăng nhập</h3>
						<form onSubmit={handleSubmit} className="login-form">
							<input
								className="login-input"
								type="tel"
								placeholder="Số điện thoại"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								required
							/>
							<input
								className="login-input"
								type="password"
								placeholder="Mật khẩu"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>

							<div className="modal-actions">
								<button type="button" className="btn btn-secondary" onClick={() => setShowLogin(false)}>
									Hủy
								</button>
								<button type="submit" className="btn btn-primary">
									Đăng nhập
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

export default function DriverDashboard() {
	const [page, setPage] = useState("");
	const [showAlertModal, setShowAlertModal] = useState(false);
	const [alertMessage, setAlertMessage] = useState("");
	const [sendToParents, setSendToParents] = useState(false);
	const [sendToAdmin, setSendToAdmin] = useState(true);

	function renderContent() {
		switch (page) {
			case "Xem lịch phân công":
				return <Assignments />;
			case "Danh sách học sinh":
				return <Students />;
			case "Thông báo":
				return <Notifications />;
			case "Trang chủ":
			default:
				return <Home />;
		}
	}
	function handleSidebarSelect(label) {
		if (label === "Gửi cảnh báo") {
			setShowAlertModal(true);
			return;
		}

		setPage(label);
	}

	function sendAlert() {
		const payload = {
			message: alertMessage,
			toParents: sendToParents,
			toAdmin: sendToAdmin || sendToParents,
		};
		console.log("Sending alert:", payload);
		// TODO: call backend API to send alert
		// close modal after send
		setShowAlertModal(false);
		setAlertMessage("");
		setSendToParents(false);
		setSendToAdmin(true);
	}

	return (
		<div className="driver-app-container">
			<Sidebar active={page} onSelect={handleSidebarSelect} menuItems={driverMenu} />
			<div className="driver-page">
				<div className="driver-content">{renderContent()}</div>
			</div>

			{showAlertModal && (
				<div className="alert-modal-overlay" onClick={() => setShowAlertModal(false)}>
					<div className="alert-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
						<h3>Gửi cảnh báo</h3>

						<textarea
							className="alert-textarea"
							placeholder="Nhập nội dung cảnh báo..."
							value={alertMessage}
							onChange={(e) => setAlertMessage(e.target.value)}
						/>

						<div className="alert-options">
							<label>
								<input
									type="checkbox"
									checked={sendToParents}
									onChange={(e) => {
										const v = e.target.checked;
										setSendToParents(v);
										if (v) setSendToAdmin(true);
									}}
								/> Gửi cho phụ huynh (kèm Admin)
							</label>

							<label>
								<input
									type="checkbox"
									checked={sendToAdmin}
									disabled={sendToParents}
									onChange={(e) => setSendToAdmin(e.target.checked)}
								/> Gửi cho Admin
							</label>
						</div>

						<div className="alert-actions">
							<button className="btn btn-secondary" onClick={() => setShowAlertModal(false)}>Hủy</button>
							<button className="btn btn-primary" onClick={sendAlert} disabled={!alertMessage.trim()}>Gửi</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
