// src/lib/scheduleUtils.js
import prisma from "@/lib/prisma";

// Get all scheduled messages
export async function getAllSchedules() {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        parameters: true,
        recipients: true,
        history: true,
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
        history: true,
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
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const updated = await prisma.schedule.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        parameters: true,
        recipients: true,
      },
    });

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
    };
  } catch (error) {
    console.error(`Error updating schedule ${id}:`, error);
    return null;
  }
}

export async function createSchedule(data) {
  const {
    name,
    templateId,
    scheduleType,
    scheduleConfig,
    sessionName,
    paramValues,
    recipients,
  } = data;

  const created = await prisma.schedule.create({
    data: {
      name,
      templateId,
      scheduleType,
      cronExpression:
        scheduleType === "recurring" ? scheduleConfig.cronExpression : null,
      scheduledDate:
        scheduleType === "once" ? new Date(scheduleConfig.date) : null,
      sessionName,
      parameters: {
        createMany: {
          data: Object.entries(paramValues).map(([paramId, paramValue]) => ({
            paramId,
            paramValue,
          })),
        },
      },
      recipients: {
        createMany: {
          data: recipients.map((r) => ({ recipient: r })),
        },
      },
    },
    include: { parameters: true, recipients: true },
  });

  return {
    id: created.id,
    ...data,
    nextRun: created.nextRun,
    lastRun: created.lastRun,
    status: created.status,
  };
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
