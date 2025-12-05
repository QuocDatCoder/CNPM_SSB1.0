// Test API parent endpoint
const userId = 7; // Parent ID
fetch(`http://localhost:8080/api/schedules/parent/my-kids-trip`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Cookie: "userId=7; vai_tro=phuhuynh",
  },
})
  .then((r) => r.json())
  .then((data) => {
    console.log("✅ API Response:");
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((e) => console.error("❌ Error:", e));
