import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import './Parent.css';

function Parent() {
  const [tab, setTab] = useState('home');
  const [notificationsTab, setNotificationsTab] = useState('inbox');
  const [parentName, setParentName] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleTabChange = (tabName) => {
    setTab(tabName);
  };

  const handleNotificationsTabChange = (tabName) => {
    setNotificationsTab(tabName);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setDisplayName(parentName);
    }
  };

  return (
    <div className="parent-app">
      <div className="parent-sidebar">
        <div className="logo-session">
          <img src="/image/logo.png" className="logo-image" alt="Logo" />
        </div>
        
        <div className={`menu-item ${tab === 'home' ? 'active' : ''}`} onClick={() => handleTabChange('home')}>
          <div className="item-icon">
            <img src="/icons/home.png" alt="Home" className="menu-icon" />
          </div>
          <div className="label-icon">
            <span>Trang chủ</span>
          </div>
        </div>
        
        <div className={`menu-item ${tab === 'location' ? 'active' : ''}`} onClick={() => handleTabChange('location')}>
          <div className="item-icon">
            <img src="/icons/route.png" alt="Location" className="menu-icon" />
          </div>
          <div className="label-icon">
            <span>Vị trí</span>
          </div>
        </div>
        
        <div className={`menu-item ${tab === 'notifications' ? 'active' : ''}`} onClick={() => handleTabChange('notifications')}>
          <div className="item-icon">
            <img src="/icons/message.png" alt="Notifications" className="menu-icon" />
          </div>
          <div className="label-icon">
            <span>Thông báo</span>
          </div>
        </div>
      </div>

      <div className="parent-content">
        {tab === 'home' && (
          <div className="parent-home">
            <div className="parent-header">
              <h1>Tên: 
                <input 
                  type="text" 
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tên phụ huynh"
                  className="parent-name-input"
                />
              </h1>
              <p>Xin chào! Chúc phụ huynh {displayName || '[Tên phụ huynh]'} có 1 ngày tốt lành. Lịch đưa đón hôm nay:</p>
              <p>6:00-7:00 sáng</p>
              <p>16:00-17:00 Chiều</p>
            </div>
            <div className="parent-routes-grid">
              <div className="parent-route-card">
                <div className="route-header">
                  <h3>Tuyến 1</h3>
                  <span className="route-status active">Đang hoạt động</span>
                </div>
                <div className="route-info">
                  <p><strong>Đường:</strong> An Dương Vương</p>
                  <p><strong>Buổi:</strong> Sáng</p>
                  <p><strong>Thời gian:</strong> 6:00-7:00</p>
                  <p><strong>Trạng thái:</strong> Chuẩn bị khởi hành</p>
                  <p><strong>Dự kiến:</strong> 6:30</p>
                </div>
                <button className="parent-btn" onClick={() => setTab('location')}>Xem vị trí</button>
              </div>

              <div className="parent-route-card">
                <div className="route-header">
                  <h3>Tuyến 2</h3>
                  <span className="route-status active">Đang hoạt động</span>
                </div>
                <div className="route-info">
                  <p><strong>Đường:</strong> Trường Chinh</p>
                  <p><strong>Buổi:</strong> Chiều</p>
                  <p><strong>Thời gian:</strong> 17:00-18:00</p>
                  <p><strong>Trạng thái:</strong> Đang di chuyển</p>
                  <p><strong>Dự kiến:</strong> 17:30</p>
                </div>
                <button className="parent-btn" onClick={() => setTab('location')}>Xem vị trí</button>
              </div>

            </div>
          </div>
        )}

        {tab === 'location' && (
          <div className="parent-location">
            <div className="map-section">
              <MapContainer
                center={[10.779783, 106.699018]}
                zoom={13}
                style={{ height: "500px", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </MapContainer>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="parent-notifications">
            <div className="parent-notifications-header">
              <button
                className={`parent-btn ${notificationsTab === 'inbox' ? 'active' : ''}`}
                onClick={() => handleNotificationsTabChange('inbox')}
              >
                Hộp thư đến
              </button>
              <button
                className={`parent-btn ${notificationsTab === 'sent' ? 'active' : ''}`}
                onClick={() => handleNotificationsTabChange('sent')}
              >
                Đã gửi
              </button>
            </div>
            <div className="parent-notification-list">
              {notificationsTab === 'inbox' && (
                <div className="parent-notification-item">
                  <input type="checkbox" />
                  <p>Tài Xế - Thông báo sắp đến trạm</p>
                  <p>Đến trạm đại học sài gòn sau 5 phút....</p>
                  <p>6:30AM/20/10</p>
                </div>
              )}
              {notificationsTab === 'sent' && (
                <div className="parent-notification-item">
                  <input type="checkbox" />
                  <p>Tài Xế - Thông báo sắp đến trạm</p>
                  <p>Đã gửi đến phụ huynh</p>
                  <p>6:30AM/20/10</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Parent;
