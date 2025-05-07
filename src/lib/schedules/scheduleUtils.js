// src/lib/schedules/scheduleUtils.js
import prisma from "@/lib/prisma";

// Get all scheduled messages
export async function getAllSchedules() {
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
    });

    return schedules.map((schedule) => ({
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
    }));
  } catch (error) {
    console.error("Error loading schedules from database:", error);
    return [];
  }
}

// Get a specific schedule by ID
export async function getScheduleById(id) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: parseInt(id) },
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

    if (!schedule) return null;

    return {
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
    };
  } catch (error) {
    console.error(`Error getting schedule ${id}:`, error);
    return null;
  }
}

// Update a schedule
export async function updateSchedule(id, data) {
  try {
    // 1) Whitelist valid columns
    const allowed = [
      "name",
      "templateId",
      "scheduleType",
      "cronExpression",
      "scheduledDate",
      "status",
      "nextRun",
      "lastRun",
      "errorMessage",
    ];

    const updateData = Object.fromEntries(
      Object.entries(data).filter(([key]) => allowed.includes(key))
    );

    // Always touch updatedAt
    updateData.updatedAt = new Date();

    // 2) Persist
    const updated = await prisma.schedule.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        parameters: true,
        recipients: true,
      },
    });

    // 3) Normalised return value
    return {
      id: updated.id,
      name: updated.name,
      templateId: updated.templateId,
      scheduleType: updated.scheduleType,
      scheduleConfig: {
        cronExpression: updated.cronExpression,
        date: updated.scheduledDate,
      },
      sessionName: updated.sessionName,
      status: updated.status,
      paramValues: Object.fromEntries(
        updated.parameters.map((p) => [p.paramId, p.paramValue])
      ),
      recipients: updated.recipients.map((r) => r.recipient),
      nextRun: updated.nextRun,
      lastRun: updated.lastRun,
      errorMessage: updated.errorMessage ?? null,
    };
  } catch (err) {
    console.error(`Error updating schedule ${id}:`, err);
    return null;
  }
}

// Add history entry to a schedule
export async function addScheduleHistory(id, historyEntry) {
  try {
    const schedule = await prisma.schedule.update({
      where: { id: parseInt(id) },
      data: {
        lastRun: new Date(),
        history: {
          create: {
            successCount: historyEntry.success,
            failedCount: historyEntry.failed,
            details: historyEntry.details,
          },
        },
      },
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

    return {
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
      history: schedule.history,
    };
  } catch (error) {
    console.error(`Error adding history to schedule ${id}:`, error);
    return null;
  }
}
