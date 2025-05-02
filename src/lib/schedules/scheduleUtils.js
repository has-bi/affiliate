// src/lib/schedules/scheduleUtils.js
import prisma from "@/lib/prisma";

/**
 * List all schedules with basic template info
 */
export async function listSchedules() {
  try {
    return await prisma.schedule.findMany({
      include: {
        template: {
          select: {
            name: true,
          },
        },
        recipients: true,
        parameters: true,
        history: {
          orderBy: {
            runAt: "desc",
          },
          take: 3, // Get only last 3 runs for preview
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  } catch (error) {
    console.error("[Schedules] Error listing schedules:", error);
    return [];
  }
}

/**
 * Get detailed schedule by ID
 */
export async function getSchedule(id) {
  try {
    return await prisma.schedule.findUnique({
      where: { id: Number(id) },
      include: {
        template: {
          include: {
            parameters: true,
          },
        },
        recipients: true,
        parameters: true,
        history: {
          orderBy: {
            runAt: "desc",
          },
          take: 10, // Get more history for detail view
        },
      },
    });
  } catch (error) {
    console.error(`[Schedules] Error fetching schedule ${id}:`, error);
    return null;
  }
}

/**
 * Create a new schedule
 */
export async function createSchedule(data) {
  try {
    // Extract related data
    const { recipients, paramValues, scheduleConfig, ...scheduleData } = data;

    // Calculate next run time based on schedule type and config
    const nextRun = calculateNextRun(data.scheduleType, scheduleConfig);

    // Create the schedule with relations
    return await prisma.schedule.create({
      data: {
        ...scheduleData,
        // Save schedule configuration
        scheduleType: data.scheduleType,
        cronExpression:
          data.scheduleType === "recurring"
            ? scheduleConfig.cronExpression
            : null,
        scheduledDate:
          data.scheduleType === "once" ? new Date(scheduleConfig.date) : null,
        nextRun,

        // Create relationships
        recipients: {
          create: recipients.map((recipient) => ({
            recipient,
          })),
        },
        parameters: {
          create: Object.entries(paramValues || {}).map(
            ([paramId, paramValue]) => ({
              paramId,
              paramValue,
            })
          ),
        },
      },
      include: {
        recipients: true,
        parameters: true,
      },
    });
  } catch (error) {
    console.error("[Schedules] Error creating schedule:", error);
    throw error; // Let the API layer handle this error
  }
}

/**
 * Update an existing schedule
 */
export async function updateSchedule(id, data) {
  try {
    const { recipients, paramValues, scheduleConfig, ...scheduleData } = data;

    // Calculate next run time if schedule type or config changed
    const nextRun = calculateNextRun(data.scheduleType, scheduleConfig);

    // Start a transaction to update everything atomically
    return await prisma.$transaction(async (tx) => {
      // 1. Update the main schedule record
      const updatedSchedule = await tx.schedule.update({
        where: { id: Number(id) },
        data: {
          ...scheduleData,
          scheduleType: data.scheduleType,
          cronExpression:
            data.scheduleType === "recurring"
              ? scheduleConfig.cronExpression
              : null,
          scheduledDate:
            data.scheduleType === "once" ? new Date(scheduleConfig.date) : null,
          nextRun,
          updatedAt: new Date(),
        },
      });

      // 2. If recipients are provided, update them
      if (recipients) {
        // Delete existing recipients
        await tx.scheduleRecipient.deleteMany({
          where: { scheduleId: Number(id) },
        });

        // Create new ones
        await Promise.all(
          recipients.map((recipient) =>
            tx.scheduleRecipient.create({
              data: {
                scheduleId: Number(id),
                recipient,
              },
            })
          )
        );
      }

      // 3. If parameters are provided, update them
      if (paramValues) {
        // Delete existing parameters
        await tx.scheduleParameter.deleteMany({
          where: { scheduleId: Number(id) },
        });

        // Create new ones
        await Promise.all(
          Object.entries(paramValues).map(([paramId, paramValue]) =>
            tx.scheduleParameter.create({
              data: {
                scheduleId: Number(id),
                paramId,
                paramValue,
              },
            })
          )
        );
      }

      return updatedSchedule;
    });
  } catch (error) {
    console.error(`[Schedules] Error updating schedule ${id}:`, error);
    throw error; // Let the API layer handle this error
  }
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id) {
  try {
    // This will cascade delete related recipients, parameters, and history
    // due to the Prisma schema configuration
    await prisma.schedule.delete({
      where: { id: Number(id) },
    });
    return true;
  } catch (error) {
    console.error(`[Schedules] Error deleting schedule ${id}:`, error);
    return false;
  }
}

/**
 * Add history entry for a schedule execution
 */
export async function addScheduleHistory(scheduleId, results) {
  try {
    return await prisma.scheduleHistory.create({
      data: {
        scheduleId: Number(scheduleId),
        successCount: results.successCount,
        failedCount: results.failedCount,
        details: results.details || {},
        runAt: new Date(),
      },
    });
  } catch (error) {
    console.error(
      `[Schedules] Error adding schedule history for ${scheduleId}:`,
      error
    );
    return null;
  }
}

/**
 * Toggle a schedule's status between active and paused
 */
export async function toggleScheduleStatus(id) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: Number(id) },
      select: { status: true },
    });

    if (!schedule) return null;

    const newStatus = schedule.status === "active" ? "paused" : "active";

    return await prisma.schedule.update({
      where: { id: Number(id) },
      data: { status: newStatus },
    });
  } catch (error) {
    console.error(`[Schedules] Error toggling schedule status ${id}:`, error);
    return null;
  }
}

/**
 * Calculate the next run time based on schedule type and configuration
 */
function calculateNextRun(scheduleType, config) {
  if (scheduleType === "once") {
    // For one-time schedules, next run is the scheduled date
    return new Date(config.date);
  } else if (scheduleType === "recurring" && config.cronExpression) {
    // For recurring schedules, calculate next occurrence based on cron
    // You'll need a cron parser library like 'cron-parser' for this
    // This is a placeholder - implement with proper cron parsing
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // +1 day placeholder
  }
  return null;
}
