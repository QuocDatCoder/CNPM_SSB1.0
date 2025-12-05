#!/usr/bin/env node
/**
 * Test Approaching Stop - Start Trip via API
 */

const http = require("http");

async function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 8080,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTest() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   APPROACHING STOP NOTIFICATION TEST (VIA API)           ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  try {
    // Step 1: Login as driver
    console.log("🔑 Step 1: Login as driver...");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
      email: "driver2@test.com",
      password: "password123",
    });

    if (loginRes.status !== 200) {
      console.error("❌ Login failed:", loginRes.data);
      return;
    }

    const token = loginRes.data.token;
    console.log(`✅ Login successful. Token: ${token.substring(0, 20)}...\n`);

    // Step 2: Get schedules
    console.log("📋 Step 2: Getting available schedules...");
    const schedulesRes = await makeRequest(
      "GET",
      "/api/schedule/my-schedules",
      null,
      token
    );

    if (schedulesRes.status !== 200) {
      console.error("❌ Get schedules failed:", schedulesRes.data);
      return;
    }

    const schedules = schedulesRes.data;
    if (!Array.isArray(schedules) || schedules.length === 0) {
      console.error("❌ No schedules available");
      return;
    }

    const schedule = schedules[0];
    const scheduleId = schedule.id || schedule.schedule_id;
    console.log(`✅ Found schedule: ${scheduleId}`);
    console.log(`   Route: ${schedule.route_id || schedule.ten_tuyen}`);
    console.log(`   Status: ${schedule.trang_thai}\n`);

    // Step 3: Start trip
    console.log(`🚀 Step 3: Starting trip (Schedule ${scheduleId})...`);
    const startRes = await makeRequest(
      "PUT",
      `/api/tracking/start-trip/${scheduleId}`,
      {},
      token
    );

    if (startRes.status !== 200) {
      console.error("❌ Start trip failed:", startRes.data);
      return;
    }

    console.log(`✅ Trip started successfully\n`);

    // Step 4: Monitor for 45 seconds
    console.log("⏱️  Monitoring for approaching stop events (45 seconds)...");
    console.log(
      "   Check backend console for: '🚨 APPROACHING STOP' messages\n"
    );

    for (let i = 0; i < 45; i++) {
      process.stdout.write(`\r   Time elapsed: ${i}s...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("\n\n✅ Test completed. Check backend console output.\n");

    // Step 5: End trip
    console.log(`⏹️  Step 4: Ending trip...`);
    const endRes = await makeRequest(
      "PUT",
      `/api/tracking/end-trip/${scheduleId}`,
      {},
      token
    );

    if (endRes.status === 200) {
      console.log(`✅ Trip ended successfully\n`);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

runTest();
