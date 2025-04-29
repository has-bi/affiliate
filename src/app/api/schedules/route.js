// src/app/api/schedules/route.js
import { listSchedules } from "@/lib/schedules/scheduleUtils";

export async function GET() {
  const schedules = await listSchedules();
  return Response.json(schedules);
}
