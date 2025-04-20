// src/app/api/schedules/route.js
import { NextResponse } from "next/server";
import {
  getAllSchedules,
  createSchedule,
  getScheduleById,
} from "../../../lib/scheduleUtils";
import schedulerService from "../../../lib/services/schedulerService";

// Initialize scheduler when the API is first accessed
let isInitialized = false;
const initScheduler = async () => {
  if (!isInitialized) {
    await schedulerService.init();
    isInitialized = true;
  }
};

// GET /api/schedules - Get all schedules
export async function GET() {
  await initScheduler();

  try {
    const schedules = getAllSchedules();
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST /api/schedules - Create a new schedule
export async function POST(request) {
  await initScheduler();

  try {
    const data = await request.json();

    // Validate required fields
    if (
      !data.name ||
      !data.templateId ||
      !data.recipients ||
      !data.scheduleType ||
      !data.scheduleConfig ||
      !data.sessionName
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the schedule
    const newSchedule = createSchedule(data);

    // Schedule the job
    schedulerService.scheduleJob(newSchedule);

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
