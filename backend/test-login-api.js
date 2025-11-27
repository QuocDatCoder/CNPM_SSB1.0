// Test Login API
// Chạy file này sau khi backend đã khởi động

const testLogin = async () => {
  const apiUrl = "http://localhost:8080/api/auth/login";

  console.log("🧪 Testing Login API...\n");

  // Test 1: Đăng nhập với admin
  console.log("Test 1: Admin login");
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "admin",
        password: "123456",
      }),
    });

    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));

    if (data.success) {
      console.log("✅ Admin login successful");
      console.log("Token:", data.data.token.substring(0, 20) + "...");
      console.log("User role:", data.data.user.vai_tro);
    } else {
      console.log("❌ Admin login failed:", data.message);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n---\n");

  // Test 2: Đăng nhập với tài xế
  console.log("Test 2: Driver login");
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "taixe1@sbms.com", // Sử dụng email
        password: "123456",
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ Driver login successful");
      console.log("User:", data.data.user.ho_ten);
      console.log("Role:", data.data.user.vai_tro);
    } else {
      console.log("❌ Driver login failed:", data.message);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n---\n");

  // Test 3: Đăng nhập với phụ huynh
  console.log("Test 3: Parent login");
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "ph1",
        password: "123456",
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ Parent login successful");
      console.log("User:", data.data.user.ho_ten);
      console.log("Role:", data.data.user.vai_tro);
    } else {
      console.log("❌ Parent login failed:", data.message);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n---\n");

  // Test 4: Đăng nhập thất bại - sai mật khẩu
  console.log("Test 4: Wrong password");
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "admin",
        password: "wrongpassword",
      }),
    });

    const data = await response.json();

    if (!data.success) {
      console.log("✅ Correctly rejected wrong password");
      console.log("Message:", data.message);
    } else {
      console.log("❌ Should have rejected wrong password");
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n---\n");

  // Test 5: Đăng nhập thất bại - user không tồn tại
  console.log("Test 5: Non-existent user");
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "nonexistent",
        password: "123456",
      }),
    });

    const data = await response.json();

    if (!data.success) {
      console.log("✅ Correctly rejected non-existent user");
      console.log("Message:", data.message);
    } else {
      console.log("❌ Should have rejected non-existent user");
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n---\n");
  console.log("🎉 All tests completed!");
};

// Run tests
testLogin();
