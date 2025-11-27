module.exports = (io, socket) => {
  // Lắng nghe sự kiện từ tài xế gửi vị trí
  socket.on('driverLocationUpdate', (data) => {
    console.log('Driver location update:', data);

    // Phát lại cho tất cả client (phụ huynh/admin)
    io.emit('busLocationUpdated', data);
  });

  // Lắng nghe sự kiện cập nhật trạng thái học sinh
  socket.on('studentStatusUpdate', (data) => {
    console.log('Student status update:', data);

    // Phát lại cho tất cả client
    io.emit('studentStatusUpdated', data);
  });
};
