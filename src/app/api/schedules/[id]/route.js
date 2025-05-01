// src/app/api/schedules/[id]/route.js
import {
  getSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/lib/schedules/scheduleUtils";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Schedules]");

// GET - Get a specific schedule
export async function GET(_, { params }) {
  try {
    const { id } = params;
    const schedule = await getSchedule(id);

    if (!schedule) {
      return Response.json({ error: "Schedule not found" }, { status: 404 });
    }

    return Response.json(schedule);
  } catch (error) {
    logger.error(`Error fetching schedule ${params.id}:`, error);
    return Response.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// PUT - Update a schedule
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    // Handle status update
    if (body.status && Object.keys(body).length === 1) {
      // Just updating status (active/paused)
      const validStatuses = ["active", "paused"];
      if (!validStatuses.includes(body.status)) {
        return Response.json(
          { error: "Invalid status value" },
          { status: 400 }
        );
      }

      const result = await updateSchedule(id, { status: body.status });
      return Response.json(result);
    }

    // Full update
    const result = await updateSchedule(id, body);
    return Response.json(result);
  } catch (error) {
    logger.error(`Error updating schedule ${params.id}:`, error);
    return Response.json(
      { error: error.message || "Failed to update schedule" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a schedule
export async function DELETE(_, { params }) {
  try {
    const { id } = params;
    await deleteSchedule(id);
    return Response.json({ success: true });
  } catch (error) {
    logger.error(`Error deleting schedule ${params.id}:`, error);
    return Response.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
