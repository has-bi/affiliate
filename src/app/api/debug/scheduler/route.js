// src/app/api/debug/scheduler/route.js
import schedulerService from "@/lib/schedules/schedulerService";
import prisma from "@/lib/db/prisma";

export async function GET(request) {
  try {
    // Get all schedules
    const schedules = await prisma.schedule.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        nextRun: true,
        lastRun: true,
        scheduleType: true,
        templateId: true,
        sessionName: true,
        _count: {
          select: {
            recipients: true,
            parameters: true,
          },
        },
      },
      orderBy: {
        nextRun: "asc",
      },
    });

    return Response.json({
      message: "Schedules found",
      count: schedules.length,
      schedules,
    });
  } catch (error) {
    console.error("Scheduler debug error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, scheduleId } = body;

    if (action === "check") {
      // Manually check for schedules
      await schedulerService.checkAndExecuteSchedules();
      return Response.json({
        message: "Schedule check triggered",
      });
    } else if (action === "execute" && scheduleId) {
      // Execute a specific schedule
      const schedule = await prisma.schedule.findUnique({
        where: { id: Number(scheduleId) },
        include: {
          recipients: true,
          parameters: true,
        },
      });

      if (!schedule) {
        return Response.json({ error: "Schedule not found" }, { status: 404 });
      }

      const result = await schedulerService.executeSchedule(schedule);
      return Response.json({
        message: `Schedule ${scheduleId} executed`,
        result,
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Scheduler debug error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
