const scheduleService = require("./src/services/schedule.service");

(async () => {
  try {
    console.log("Calling getStudentsByStop(1)...\n");
    const result = await scheduleService.getStudentsByStop(1);
    console.log("Result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
    console.error(err);
  }
  process.exit(0);
})();
