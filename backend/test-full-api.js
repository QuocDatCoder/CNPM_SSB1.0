const scheduleService = require("./src/services/schedule.service");

(async () => {
  try {
    console.log("=== Testing Get Students By Stop ===\n");
    const studentsByStop = await scheduleService.getStudentsByStop(1);
    console.log("Total stops:", studentsByStop.length);
    console.log("Stops with students:");
    studentsByStop.forEach((stop) => {
      if (stop.students.length > 0) {
        console.log(`  - ${stop.stopName}: ${stop.students.length} students`);
        stop.students.forEach((s) => {
          console.log(
            `    * ${s.studentName} (${s.studentClass}) - Status: ${s.status}`
          );
        });
      }
    });

    console.log("\n=== Testing Calculate Stop Distances ===\n");
    // Test with driver at approximate central location
    const driverLat = 10.73;
    const driverLng = 106.69;
    const distances = await scheduleService.calculateStopDistances(
      1,
      driverLat,
      driverLng
    );

    console.log("Stops with distances from driver position:");
    distances.forEach((stop) => {
      const nearby = stop.isNearby ? "📍 NEARBY" : "";
      console.log(`  - ${stop.stopName}: ${stop.distanceText} ${nearby}`);
    });
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
})();
