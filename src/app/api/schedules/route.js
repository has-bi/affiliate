// src/app/api/debug/schedules/route.js
import prisma from "@/lib/db/prisma";
import schedulerService from "@/lib/schedules/schedulerService";

export async function GET(request) {
  try {
    // Get active schedules
    const activeSchedules = await prisma.schedule.findMany({
      where: { status: "active" },
      include: {
        recipients: true,
        parameters: true,
        template: true,
      },
    });

    return Response.json({
      message: "Active schedules found",
      schedules: activeSchedules.map((s) => ({
        id: s.id,
        name: s.name,
        nextRun: s.nextRun,
        lastRun: s.lastRun,
        templateId: s.templateId,
        scheduleType: s.scheduleType,
        recipientCount: s.recipients.length,
        parameterCount: s.parameters.length,
      })),
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Manually trigger check for schedules
export async function POST(request) {
  try {
    const result = await schedulerService.checkAndExecuteSchedules();
    return Response.json({
      message: "Scheduler check triggered",
      result,
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
