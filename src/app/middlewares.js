// src/app/middlewares.js
import { initializeSchedules } from "@/lib/schedules/schedulerService";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[Middleware]");
let isSchedulerInitialized = false;

export async function middleware(request) {
  // Only initialize on server-side API routes
  if (typeof window === "undefined" && !isSchedulerInitialized) {
    try {
      logger.info("Initializing scheduler from middleware");
      await initializeSchedules();
      isSchedulerInitialized = true;
      logger.info("Scheduler initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize scheduler:", error);
    }
  }

  return null;
}

export const config = {
  matcher: ["/api/:path*"],
};
