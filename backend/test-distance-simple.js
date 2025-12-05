#!/usr/bin/env node
/**
 * Direct test: Call API endpoints with fetch
 */

const BASE_URL = "http://localhost:8080";

async function makeRequest(method, path, body = null, token = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

async function main() {
  console.log("🧪 APPROACHING STOP DISTANCE TEST\n");

  // 1. Login
  console.log("1️⃣  Logging in as driver...");
  const loginRes = await makeRequest("POST", "/api/auth/login", {
    email: "driver2@test.com",
    password: "password123",
  });

  if (loginRes.status !== 200) {
    console.error("❌ Login failed:", loginRes.data || loginRes.error);
    return;
  }

  const token = loginRes.data.token;
  console.log(`✅ Logged in. Token: ${token.substring(0, 20)}...\n`);

  // 2. Get schedules
  console.log("2️⃣  Fetching schedules...");
  const schedulesRes = await makeRequest(
    "GET",
    "/api/schedule/my-schedules",
    null,
    token
  );

  if (schedulesRes.status !== 200) {
    console.error("❌ Get schedules failed");
    return;
  }

  const schedules = schedulesRes.data;
  if (!Array.isArray(schedules) || schedules.length === 0) {
    console.error("❌ No schedules found");
    return;
  }

  const schedule = schedules[0];
  const scheduleId = schedule.id || schedule.schedule_id;
  console.log(`✅ Found schedule ${scheduleId}\n`);

  // 3. Start trip
  console.log(`3️⃣  Starting trip (schedule ${scheduleId})...`);
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

  console.log(`✅ Trip started!\n`);
  console.log(
    `⏱️  Running for 30 seconds to capture approaching-stop events...`
  );
  console.log(`   Watch backend console for: 🚨 APPROACHING STOP\n`);

  await new Promise((resolve) => setTimeout(resolve, 30000));

  // 4. End trip
  console.log(`\n✅ Ending trip...`);
  await makeRequest("PUT", `/api/tracking/end-trip/${scheduleId}`, {}, token);

  console.log(`✅ Done!`);
}

main().catch(console.error);
