// src/app/api/schedules/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import schedulerService from "@/lib/services/schedulerService";

export async function GET() {
  console.log("API: Fetching schedules...");

  try {
    const schedules = await prisma.schedule.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("API: Found schedules:", schedules.length);

    // Transform the data to match the expected format
    const transformedSchedules = schedules.map((schedule) => {
      const transformed = {
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

      console.log("API: Transformed schedule:", transformed);
      return transformed;
    });

    console.log(
      "API: Returning transformed schedules:",
      transformedSchedules.length
    );
    return NextResponse.json(transformedSchedules);
  } catch (error) {
    console.error("API: Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules", details: error.message },
      { status: 500 }
    );
  }
}
