// Sample schedules data for driver assignments (week view)
// Days use Vietnamese labels matching the Assignments UI

const weekSchedule = [
  {
    day: "Thứ 2",
    slots: [
      { type: "go", route: "Tuyến 1", start: "07:00", end: "10:00" },
      { type: "back", route: "Tuyến 2", start: "14:00", end: "17:00" },
    ],
  },
  { day: "Thứ 3", slots: [] },
  { day: "Thứ 4", slots: [] },
  { day: "Thứ 5", slots: [] },
  { day: "Thứ 6", slots: [] },
  { day: "Thứ 7", slots: [] },
];

export default weekSchedule;
