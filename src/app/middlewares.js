import { initializeSchedules } from "@/lib/schedules/schedulerService";

export async function middleware(request) {
  // Initialize schedules on server start
  console.log("🔄 Attempting to initialize scheduler service...");
  await initializeSchedules();
  console.log("✅ Scheduler service initialized successfully");
  return null;
}

export const config = {
  matcher: ["/api/:path*"],
};
