export const routes = [
  {
    id: "001",
    name: "Tuyến 1",
    street: "An Dương Vương",
    distance: "5km",
    duration: "20 phút",
    time: "4:00–6:00",
    start: [10.779783, 106.699018], // Nhà thờ Đức Bà
    end: [10.779886, 106.695469], // Dinh Độc Lập
    startName: "Nhà thờ Đức Bà",
    endName: "Dinh Độc Lập",
    mapImage: "/image/map-route.png",
    stops: [
      {
        id: 1,
        name: "Trạm 1: Nhà thờ Đức Bà",
        position: [10.779783, 106.699018],
        time: "4:00",
      },
      {
        id: 2,
        name: "Trạm 2: Bưu điện TP",
        position: [10.779965, 106.69867],
        time: "4:05",
      },
      {
        id: 3,
        name: "Trạm 3: Công viên 30/4",
        position: [10.779573, 106.697892],
        time: "4:10",
      },
      {
        id: 4,
        name: "Trạm 4: Nhà hát TP",
        position: [10.779468, 106.697013],
        time: "4:15",
      },
      {
        id: 5,
        name: "Trạm 5: Bảo tàng",
        position: [10.779665, 106.696234],
        time: "4:18",
      },
      {
        id: 6,
        name: "Trạm 6: Dinh Độc Lập",
        position: [10.779886, 106.695469],
        time: "4:20",
      },
    ],
  },
  {
    id: "002",
    name: "Tuyến 2",
    street: "Lê Lợi",
    distance: "7km",
    duration: "25 phút",
    time: "5:00–7:00",
    start: [10.772461, 106.698055], // Bến Thành
    end: [10.762622, 106.682225], // Công viên 23/9
    startName: "Chợ Bến Thành",
    endName: "Công viên 23/9",
    mapImage: "/image/map-route.png",
    stops: [
      {
        id: 1,
        name: "Trạm 1: Chợ Bến Thành",
        position: [10.772461, 106.698055],
        time: "5:00",
      },
      {
        id: 2,
        name: "Trạm 2: Phố đi bộ Nguyễn Huệ",
        position: [10.770834, 106.695567],
        time: "5:05",
      },
      {
        id: 3,
        name: "Trạm 3: Công viên Tao Đàn",
        position: [10.768392, 106.691234],
        time: "5:10",
      },
      {
        id: 4,
        name: "Trạm 4: Bệnh viện Chợ Rẫy",
        position: [10.766845, 106.688456],
        time: "5:15",
      },
      {
        id: 5,
        name: "Trạm 5: Bến xe An Sương",
        position: [10.764723, 106.685123],
        time: "5:20",
      },
      {
        id: 6,
        name: "Trạm 6: Công viên 23/9",
        position: [10.762622, 106.682225],
        time: "5:25",
      },
    ],
  },
  {
    id: "003",
    name: "Tuyến 3",
    street: "Nguyễn Huệ",
    distance: "4km",
    duration: "18 phút",
    time: "6:00–8:00",
    start: [10.768721, 106.704514], // Nhà hát Thành phố
    end: [10.773996, 106.700683], // Thư viện Khoa học
    startName: "Nhà hát Thành phố",
    endName: "Thư viện Khoa học Tổng hợp",
    mapImage: "/image/map-route.png",
    stops: [
      {
        id: 1,
        name: "Trạm 1: Nhà hát TP",
        position: [10.768721, 106.704514],
        time: "6:00",
      },
      {
        id: 2,
        name: "Trạm 2: Khách sạn Rex",
        position: [10.769845, 106.703456],
        time: "6:04",
      },
      {
        id: 3,
        name: "Trạm 3: Bitexco",
        position: [10.771234, 106.702234],
        time: "6:08",
      },
      {
        id: 4,
        name: "Trạm 4: Bảo tàng Mỹ thuật",
        position: [10.772567, 106.701456],
        time: "6:12",
      },
      {
        id: 5,
        name: "Trạm 5: Công viên Lê Văn Tám",
        position: [10.773123, 106.700956],
        time: "6:15",
      },
      {
        id: 6,
        name: "Trạm 6: Thư viện KH",
        position: [10.773996, 106.700683],
        time: "6:18",
      },
    ],
  },
  {
    id: "004",
    name: "Tuyến 4",
    street: "Trường Chinh",
    distance: "10km",
    duration: "30 phút",
    time: "7:00–9:00",
    start: [10.804173, 106.717889], // Sân bay Tân Sơn Nhất
    end: [10.782781, 106.702271], // Bến xe Miền Đông
    startName: "Sân bay Tân Sơn Nhất",
    endName: "Bến xe Miền Đông",
    mapImage: "/image/map-route.png",
    stops: [
      {
        id: 1,
        name: "Trạm 1: Sân bay TSN",
        position: [10.804173, 106.717889],
        time: "7:00",
      },
      {
        id: 2,
        name: "Trạm 2: Vòng xoay Hoàng Hoa Thám",
        position: [10.799456, 106.713234],
        time: "7:06",
      },
      {
        id: 3,
        name: "Trạm 3: Bến xe Chợ Lớn",
        position: [10.794567, 106.709123],
        time: "7:12",
      },
      {
        id: 4,
        name: "Trạm 4: Công viên Lê Thị Riêng",
        position: [10.789234, 106.706234],
        time: "7:18",
      },
      {
        id: 5,
        name: "Trạm 5: Vòng xoay Nguyễn Thái Sơn",
        position: [10.785678, 106.704123],
        time: "7:24",
      },
      {
        id: 6,
        name: "Trạm 6: Bến xe Miền Đông",
        position: [10.782781, 106.702271],
        time: "7:30",
      },
    ],
  },
  {
    id: "005",
    name: "Tuyến 5",
    street: "Võ Văn Kiệt",
    distance: "6km",
    duration: "22 phút",
    time: "8:00–10:00",
    start: [10.757542, 106.686234], // Bến Nghé
    end: [10.756389, 106.702639], // Chợ Bình Tây
    startName: "Bến Nghé",
    endName: "Chợ Bình Tây",
    mapImage: "/image/map-route.png",
    stops: [
      {
        id: 1,
        name: "Trạm 1: Bến Nghé",
        position: [10.757542, 106.686234],
        time: "8:00",
      },
      {
        id: 2,
        name: "Trạm 2: Cầu Khánh Hội",
        position: [10.757234, 106.689456],
        time: "8:05",
      },
      {
        id: 3,
        name: "Trạm 3: Chợ Tân Định",
        position: [10.756892, 106.693234],
        time: "8:10",
      },
      {
        id: 4,
        name: "Trạm 4: Nhà văn hóa Q5",
        position: [10.756567, 106.696789],
        time: "8:15",
      },
      {
        id: 5,
        name: "Trạm 5: Công viên Phú Lâm",
        position: [10.756445, 106.699567],
        time: "8:18",
      },
      {
        id: 6,
        name: "Trạm 6: Chợ Bình Tây",
        position: [10.756389, 106.702639],
        time: "8:22",
      },
    ],
  },
  {
    id: "006",
    name: "Tuyến 6",
    street: "Cách Mạng Tháng 8",
    distance: "8km",
    duration: "28 phút",
    time: "9:00–11:00",
    start: [10.762622, 106.682225], // Công viên 23/9
    end: [10.785411, 106.695242], // ĐH Bách Khoa
    startName: "Công viên 23/9",
    endName: "ĐH Bách Khoa",
    mapImage: "/image/map-route.png",
    stops: [
      {
        id: 1,
        name: "Trạm 1: Công viên 23/9",
        position: [10.762622, 106.682225],
        time: "9:00",
      },
      {
        id: 2,
        name: "Trạm 2: Trường ĐH Y Dược",
        position: [10.767345, 106.685678],
        time: "9:05",
      },
      {
        id: 3,
        name: "Trạm 3: Công viên Gia Định",
        position: [10.772456, 106.688234],
        time: "9:11",
      },
      {
        id: 4,
        name: "Trạm 4: ĐH Sư phạm",
        position: [10.777123, 106.690789],
        time: "9:17",
      },
      {
        id: 5,
        name: "Trạm 5: Nhà thi đấu Phú Thọ",
        position: [10.781567, 106.693012],
        time: "9:23",
      },
      {
        id: 6,
        name: "Trạm 6: ĐH Bách Khoa",
        position: [10.785411, 106.695242],
        time: "9:28",
      },
    ],
  },
];
