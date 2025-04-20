// src/app/api/schedules/[id]/route.js
import { NextResponse } from "next/server";
import {
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "../../../../lib/scheduleUtils";
import schedulerService from "../../../../lib/services/schedulerService";

// GET /api/schedules/[id] - Get a specific schedule
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const schedule = getScheduleById(id);

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error(`Error fetching schedule ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// PUT /api/schedules/[id] - Update a schedule
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();

    const existingSchedule = getScheduleById(id);
    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Update the schedule
    const updatedSchedule = updateSchedule(id, data);

    // Update the job if needed
    if (data.scheduleConfig || data.scheduleType || data.status === "active") {
      schedulerService.updateJob(id);
    } else if (data.status === "paused" || data.status === "cancelled") {
      schedulerService.cancelJob(id);
    }

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error(`Error updating schedule ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

// DELETE /api/schedules/[id] - Delete a schedule
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const existingSchedule = getScheduleById(id);
    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Cancel the job
    schedulerService.cancelJob(id);

    // Delete the schedule
    const result = deleteSchedule(id);

    return NextResponse.json({ success: result });
  } catch (error) {
    console.error(`Error deleting schedule ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
