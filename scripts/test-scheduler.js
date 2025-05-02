// scripts/test-scheduler.js
import { initializeSchedules } from "../src/lib/schedules/schedulerService";
import schedulerService from "../src/lib/schedules/schedulerService";

async function testScheduler() {
  console.log("Initializing scheduler...");
  await initializeSchedules();
  console.log("Running schedule check...");
  await schedulerService.checkAndExecuteSchedules();
  console.log("Done. Check logs for details.");
  process.exit(0);
}

testScheduler().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
