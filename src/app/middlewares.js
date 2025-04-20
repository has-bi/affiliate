import { initializeSchedules } from "@/lib/services/schedulerService";

export async function middleware(request) {
  // Initialize schedules on server start
  await initializeSchedules();
  return null;
}

export const config = {
  matcher: ["/api/:path*"],
};
