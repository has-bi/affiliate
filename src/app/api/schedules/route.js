// src/app/api/schedules/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import schedulerService from "@/lib/schedules/schedulerService";

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

export async function POST(request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (
      !data.name ||
      !data.templateId ||
      !data.scheduleType ||
      !data.sessionName
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Format recipients
    if (
      !data.recipients ||
      !Array.isArray(data.recipients) ||
      data.recipients.length === 0
    ) {
      return NextResponse.json(
        { error: "Recipients must be a non-empty array" },
        { status: 400 }
      );
    }

    // Handle schedule creation with transaction
    const schedule = await prisma.$transaction(async (tx) => {
      // Create the base schedule
      const newSchedule = await tx.schedule.create({
        data: {
          name: data.name,
          templateId: data.templateId,
          scheduleType: data.scheduleType,
          // For one-time schedules
          scheduledDate:
            data.scheduleType === "once" && data.scheduleConfig?.date
              ? new Date(data.scheduleConfig.date)
              : null,
          // For recurring schedules
          cronExpression:
            data.scheduleType === "recurring"
              ? data.scheduleConfig.cronExpression
              : null,
          status: "active",
          sessionName: data.sessionName,
        },
      });

      // Create parameters
      if (data.paramValues) {
        await Promise.all(
          Object.entries(data.paramValues).map(([paramId, paramValue]) =>
            tx.scheduleParameter.create({
              data: {
                scheduleId: newSchedule.id,
                paramId,
                paramValue: String(paramValue || ""),
              },
            })
          )
        );
      }

      // Create recipients
      await Promise.all(
        data.recipients.map((recipient) =>
          tx.scheduleRecipient.create({
            data: {
              scheduleId: newSchedule.id,
              recipient,
            },
          })
        )
      );

      return newSchedule;
    });

    // Initialize the job in the scheduler
    const scheduleData = {
      id: schedule.id,
      name: schedule.name,
      templateId: schedule.templateId,
      scheduleType: schedule.scheduleType,
      scheduleConfig: {
        cronExpression: schedule.cronExpression,
        date: schedule.scheduledDate,
      },
      sessionName: schedule.sessionName,
      paramValues: data.paramValues || {},
      recipients: data.recipients,
    };

    // This will schedule the job and update the nextRun field
    schedulerService.scheduleJob(scheduleData);

    // Fetch the updated schedule with parameters and recipients
    const updatedSchedule = await prisma.schedule.findUnique({
      where: { id: schedule.id },
      include: {
        parameters: true,
        recipients: true,
      },
    });

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule", details: error.message },
      { status: 500 }
    );
  }
}
