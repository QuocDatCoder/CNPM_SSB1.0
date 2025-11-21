import React, { useState } from "react";
import Sidebar from "../../components/common/Sidebar/Sidebar";
import Assignments from "./Assignments";
import Students from "./Students";
import Notifications from "./Notifications";
import "./Dashboard.css";

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

			<div className="driver-welcome">
				<p>Chào mừng, đây là trang tóm tắt cho tài xế.</p>
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
	const [page, setPage] = useState("Trang chủ");

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

	return (
		<div className="driver-app-container">
			<Sidebar active={page} onSelect={(label) => setPage(label)} menuItems={driverMenu} />
			<div className="driver-page">
				<div className="driver-content">{renderContent()}</div>
			</div>
		</div>
	);
}
