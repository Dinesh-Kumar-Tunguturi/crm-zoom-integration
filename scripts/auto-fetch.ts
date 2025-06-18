// // scripts/auto-fetch.ts
// import cron from "node-cron";

// console.log("🔁 Auto-fetch script started...");

// // Schedule the task to run every 1 minute
// cron.schedule("*/1 * * * *", async () => {
//   try {
//     console.log("⏰ Cron triggered at", new Date().toLocaleTimeString());

//     const response = await fetch("http://localhost:3000/api/fetch-google-sheet");
    
//     if (!response.ok) {
//       throw new Error(`❌ Fetch failed with status ${response.status}`);
//     }

//     const result = await response.json();
//     console.log("✅ Auto-fetch response:", result.message || result);
//   } catch (err) {
//     console.error("🚨 Auto-fetch error:", err);
//   }
// });



// scripts/auto-fetch.ts
// import cron from "node-cron";
// import fetch from "node-fetch"; // Required in Node for `fetch`

// console.log("🔁 Auto-fetch script started...");

// cron.schedule("*/1 * * * *", async () => {
//   try {
//     console.log("⏰ Cron triggered at", new Date().toLocaleTimeString());

//     const response = await fetch("http://localhost:3000/api/fetch-google-sheet");

//     if (!response.ok) {
//       throw new Error(`❌ Fetch failed with status ${response.status}`);
//     }

//     const result = await response.json();
//     console.log("✅ Auto-fetch response:", result.message || result);
//   } catch (err) {
//     console.error("🚨 Auto-fetch error:", err);
//   }
// });



import cron from "node-cron";

console.log("🔁 Auto-fetch script started...");

// ⏰ Runs every 30 minute. Change to */20 * * * * for every 20 mins in production
cron.schedule("*/30 * * * *", async () => {
  try {
    console.log("⏰ Cron triggered at", new Date().toLocaleTimeString());

    const response = await fetch("http://localhost:3000/api/fetch-google-sheet");

    if (!response.ok) {
      throw new Error(`❌ Fetch failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Auto-fetch response:", result.message || result);
  } catch (err) {
    console.error("🚨 Auto-fetch error:", err);
  }
});
