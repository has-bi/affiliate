// src/scripts/scheduler-worker.js
import { initializeSchedules } from "../lib/schedules/schedulerService.js";
import { createLogger } from "../lib/utils.js";

const logger = createLogger("[Worker]");

async function startWorker() {
  logger.info("Starting scheduler worker");

  try {
    await initializeSchedules();
    logger.info("Scheduler initialized successfully");

    // Keep the process running
    process.stdin.resume();

    // Handle termination
    process.on("SIGINT", () => {
      logger.info("Gracefully shutting down...");
      process.exit(0);
    });

    logger.info("Worker running and waiting for schedules...");
  } catch (error) {
    logger.error("Failed to start scheduler worker:", error);
    process.exit(1);
  }
}

startWorker().catch((error) => {
  logger.error("Unhandled error:", error);
  process.exit(1);
});
