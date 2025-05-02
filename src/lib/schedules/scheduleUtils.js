// src/lib/schedules/scheduleUtils.js
import prisma from "@/lib/db/prisma";
import { calculateNextRunTime } from "./cronUtils";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[Schedules]");

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
    logger.error("Error listing schedules:", error);
    return [];
  }
}

/**
 * Get detailed schedule by ID
 */
export async function getSchedule(id) {
  try {
    const numericId = Number(id);

    if (isNaN(numericId)) {
      logger.error(`Invalid schedule ID format: ${id}`);
      return null;
    }

    return await prisma.schedule.findUnique({
      where: { id: numericId },
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
    logger.error(`Error fetching schedule ${id}:`, error);
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

    // Set default status to active
    const status = scheduleData.status || "active";

    // Calculate next run time based on schedule type and config
    let nextRun = null;

    if (data.scheduleType === "once") {
      // For one-time schedules, explicitly handle the date
      if (scheduleConfig && scheduleConfig.date) {
        nextRun = new Date(scheduleConfig.date);
        console.log(
          `Setting nextRun for one-time schedule to: ${nextRun.toISOString()}`
        );
      }
    } else {
      // For recurring schedules, use the calculation function
      nextRun = calculateNextRunTime(data.scheduleType, scheduleConfig);
    }

    // Create the schedule with all its relations
    return await prisma.schedule.create({
      data: {
        ...scheduleData,
        status,

        // Save schedule configuration
        scheduleType: data.scheduleType,
        cronExpression:
          data.scheduleType === "recurring"
            ? scheduleConfig.cronExpression
            : null,
        scheduledDate:
          data.scheduleType === "once" ? new Date(scheduleConfig.date) : null,
        nextRun, // Use our explicitly calculated nextRun

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
    logger.error("Error creating schedule:", error);
    throw error; // Let the API layer handle this error
  }
}

/**
 * Update an existing schedule
 */
export async function updateSchedule(id, data) {
  try {
    const numericId = Number(id);

    if (isNaN(numericId)) {
      throw new Error("Invalid schedule ID format");
    }

    // Handle simple status update
    if (data.status && Object.keys(data).length === 1) {
      return await prisma.schedule.update({
        where: { id: numericId },
        data: { status: data.status },
      });
    }

    // Handle full update with relations
    const { recipients, paramValues, scheduleConfig, ...scheduleData } = data;

    // Calculate next run time if schedule type or config changed
    let nextRun = undefined;
    if (scheduleConfig) {
      nextRun = calculateNextRunTime(data.scheduleType, scheduleConfig);
    }

    // Start a transaction to update everything atomically
    return await prisma.$transaction(async (tx) => {
      // 1. Update the main schedule record
      const updatedSchedule = await tx.schedule.update({
        where: { id: numericId },
        data: {
          ...scheduleData,
          scheduleType: data.scheduleType,
          cronExpression:
            data.scheduleType === "recurring" && scheduleConfig
              ? scheduleConfig.cronExpression
              : undefined,
          scheduledDate:
            data.scheduleType === "once" && scheduleConfig?.date
              ? new Date(scheduleConfig.date)
              : undefined,
          nextRun,
          updatedAt: new Date(),
        },
      });

      // 2. If recipients are provided, update them
      if (recipients) {
        // Delete existing recipients
        await tx.scheduleRecipient.deleteMany({
          where: { scheduleId: numericId },
        });

        // Create new ones
        await Promise.all(
          recipients.map((recipient) =>
            tx.scheduleRecipient.create({
              data: {
                scheduleId: numericId,
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
          where: { scheduleId: numericId },
        });

        // Create new ones
        await Promise.all(
          Object.entries(paramValues).map(([paramId, paramValue]) =>
            tx.scheduleParameter.create({
              data: {
                scheduleId: numericId,
                paramId,
                paramValue,
              },
            })
          )
        );
      }

      // Fetch and return the updated schedule with related data
      return tx.schedule.findUnique({
        where: { id: numericId },
        include: {
          recipients: true,
          parameters: true,
        },
      });
    });
  } catch (error) {
    logger.error(`Error updating schedule ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id) {
  try {
    const numericId = Number(id);

    if (isNaN(numericId)) {
      throw new Error("Invalid schedule ID format");
    }

    // This will cascade delete related records due to the Prisma schema
    await prisma.schedule.delete({
      where: { id: numericId },
    });

    return true;
  } catch (error) {
    logger.error(`Error deleting schedule ${id}:`, error);
    return false;
  }
}

/**
 * Add history entry for a schedule execution
 */
export async function addScheduleHistory(scheduleId, results) {
  try {
    const numericId = Number(scheduleId);

    if (isNaN(numericId)) {
      throw new Error("Invalid schedule ID format");
    }

    return await prisma.scheduleHistory.create({
      data: {
        scheduleId: numericId,
        successCount: results.successCount,
        failedCount: results.failedCount,
        details: results.details || {},
        runAt: new Date(),
      },
    });
  } catch (error) {
    logger.error(`Error adding schedule history for ${scheduleId}:`, error);
    return null;
  }
}
