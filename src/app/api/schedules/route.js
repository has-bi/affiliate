// src/app/api/schedules/route.js
import { listSchedules, createSchedule } from "@/lib/schedules/scheduleUtils";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Schedules]");

// GET - List all schedules
export async function GET() {
  try {
    const schedules = await listSchedules();
    return Response.json(schedules);
  } catch (error) {
    logger.error("Error listing schedules:", error);
    return Response.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST - Create a new schedule
export async function POST(req) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.templateId) {
      return Response.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    if (!body.sessionName) {
      return Response.json(
        { error: "Session name is required" },
        { status: 400 }
      );
    }

    if (
      !body.recipients ||
      !Array.isArray(body.recipients) ||
      body.recipients.length === 0
    ) {
      return Response.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    // Create schedule in database
    const result = await createSchedule(body);

    return Response.json(result);
  } catch (error) {
    logger.error("Error creating schedule:", error);
    return Response.json(
      { error: error.message || "Failed to create schedule" },
      { status: 500 }
    );
  }
}
