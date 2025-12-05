#!/usr/bin/env node
/**
 * Test Approaching Stop Notification
 * Starts a trip and monitors distance calculation
 */

const http = require("http");

// Mock socket.io for testing
const mockIO = {
  to: (room) => ({
    emit: (eventName, data) => {
      console.log(`\n📡 [Socket.io] Event emitted to room "${room}"`);
      console.log(`   Event: ${eventName}`);
      console.log(`   Data:`, JSON.stringify(data, null, 2));
    },
  }),
};

// Load services to test directly
const {
  BusSimulator,
  startBusSimulator,
} = require("./src/services/bus-simulator.service");

async function testApproachingStop() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   APPROACHING STOP NOTIFICATION TEST                     ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  try {
    // Test with schedule ID 1
    const scheduleId = 1;
    console.log(`🚀 Starting bus simulator for schedule ${scheduleId}...`);

    // This will:
    // 1. Load schedule from database
    // 2. Load route stops from database
    // 3. Start the simulator with 2-second update interval
    // 4. Each 2 seconds, it will call checkApproachingStop()
    const simulator = await startBusSimulator(scheduleId, mockIO);

    console.log(`✅ Simulator started successfully`);
    console.log(`   Total stops: ${simulator.stops.length}`);
    console.log(`   Update interval: ${simulator.updateInterval}ms`);
    console.log(
      `   Total distance: ${simulator.totalDistance.toFixed(2)} km\n`
    );

    // Let it run for 30 seconds to see approaching stop events
    console.log(
      "⏱️  Running for 30 seconds to detect approaching stop events...\n"
    );
    await new Promise((resolve) => setTimeout(resolve, 30000));

    console.log("\n✅ Test completed");
    simulator.stop();
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testApproachingStop();
