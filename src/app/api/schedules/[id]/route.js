// src/app/api/schedules/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import schedulerService from "@/lib/services/schedulerService";

// GET /api/schedules/[id] - Get a specific schedule
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const scheduleId = parseInt(id, 10);

    if (isNaN(scheduleId)) {
      return NextResponse.json(
        { error: "Invalid schedule ID" },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        parameters: true,
        recipients: true,
        history: {
          orderBy: {
            runAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const transformedSchedule = {
      id: schedule.id,
      name: schedule.name,
      templateId: schedule.templateId,
      scheduleType: schedule.scheduleType,
      scheduleConfig: {
        cronExpression: schedule.cronExpression,
        date: schedule.scheduledDate,
      },
      sessionName: schedule.sessionName,
      status: schedule.status,
      paramValues: Object.fromEntries(
        schedule.parameters.map((p) => [p.paramId, p.paramValue])
      ),
      recipients: schedule.recipients.map((r) => r.recipient),
      nextRun: schedule.nextRun,
      lastRun: schedule.lastRun,
      history: schedule.history,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };

    return NextResponse.json(transformedSchedule);
  } catch (error) {
    console.error(`Error fetching schedule:`, error);
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
    const scheduleId = parseInt(id, 10);
    const data = await request.json();

    if (isNaN(scheduleId)) {
      return NextResponse.json(
        { error: "Invalid schedule ID" },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Update schedule with transaction
    const updatedSchedule = await prisma.$transaction(async (tx) => {
      // Delete existing parameters and recipients
      await tx.scheduleParameter.deleteMany({
        where: { scheduleId },
      });
      await tx.scheduleRecipient.deleteMany({
        where: { scheduleId },
      });

      // Update schedule
      const schedule = await tx.schedule.update({
        where: { id: scheduleId },
        data: {
          name: data.name,
          templateId: data.templateId,
          scheduleType: data.scheduleType,
          cronExpression: data.scheduleConfig?.cronExpression,
          scheduledDate:
            data.scheduleType === "once"
              ? new Date(data.scheduleConfig.date)
              : null,
          status: data.status || existingSchedule.status,
          sessionName: data.sessionName,
          updatedAt: new Date(),
          parameters: {
            create: Object.entries(data.paramValues || {}).map(
              ([paramId, paramValue]) => ({
                paramId,
                paramValue: paramValue?.toString() || "",
              })
            ),
          },
          recipients: {
            create: data.recipients.map((recipient) => ({
              recipient: recipient,
            })),
          },
        },
        include: {
          parameters: true,
          recipients: true,
        },
      });

      return schedule;
    });

    // Update the scheduler job if needed
    if (data.status === "active" || !data.status) {
      const scheduleData = {
        id: updatedSchedule.id,
        name: updatedSchedule.name,
        templateId: updatedSchedule.templateId,
        scheduleType: updatedSchedule.scheduleType,
        scheduleConfig: {
          cronExpression: updatedSchedule.cronExpression,
          date: updatedSchedule.scheduledDate,
        },
        sessionName: updatedSchedule.sessionName,
        paramValues: Object.fromEntries(
          updatedSchedule.parameters.map((p) => [p.paramId, p.paramValue])
        ),
        recipients: updatedSchedule.recipients.map((r) => r.recipient),
        status: updatedSchedule.status,
      };

      schedulerService.scheduleJob(scheduleData);
    } else if (data.status === "paused" || data.status === "cancelled") {
      schedulerService.cancelJob(scheduleId);
    }

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error(`Error updating schedule:`, error);
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
    const scheduleId = parseInt(id, 10);

    if (isNaN(scheduleId)) {
      return NextResponse.json(
        { error: "Invalid schedule ID" },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Cancel the job if it exists
    schedulerService.cancelJob(scheduleId);

    // Delete schedule (cascading will delete related records)
    await prisma.schedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting schedule:`, error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
