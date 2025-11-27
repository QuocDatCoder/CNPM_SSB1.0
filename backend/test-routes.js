// Simple test to check if backend is running and routes are loaded
const http = require("http");

console.log("Testing backend endpoints...\n");

// Test root endpoint
const testRoot = () => {
  return new Promise((resolve) => {
    http
      .get("http://localhost:8080/", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          console.log("✅ Root endpoint OK:", data);
          resolve();
        });
      })
      .on("error", (err) => {
        console.log("❌ Root endpoint failed:", err.message);
        resolve();
      });
  });
};

// Test auth login endpoint (should get 400 or 401 since no body)
const testAuthLogin = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 8080,
      path: "/api/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 404) {
          console.log("❌ Auth login route NOT FOUND (404)");
        } else {
          console.log(`✅ Auth login route exists (Status: ${res.statusCode})`);
          console.log("Response:", data);
        }
        resolve();
      });
    });

    req.on("error", (err) => {
      console.log("❌ Auth login failed:", err.message);
      resolve();
    });

    req.write(JSON.stringify({}));
    req.end();
  });
};

// Run tests
(async () => {
  await testRoot();
  console.log("");
  await testAuthLogin();
  console.log("\nTest complete!");
})();
