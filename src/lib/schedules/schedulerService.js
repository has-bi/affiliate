// src/lib/schedules/schedulerService.js
import prisma from "@/lib/db/prisma";
import { calculateNextRunTime } from "./cronUtils";
import { getTemplate } from "@/lib/templates/templateUtils";
import { formatPhoneNumber } from "@/lib/utils";
import wahaClient from "@/lib/whatsapp/wahaClient";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[SchedulerService]");

class SchedulerService {
  constructor() {
    this.isPolling = false;
    this.pollingInterval = 60000; // Check every minute
    this.pollTimer = null;
    this.initialized = false;
  }

  /**
   * Initialize the scheduler with database polling
   */
  async init() {
    logger.info("Initializing scheduler service");

    // Skip multiple initializations
    if (this.initialized) {
      logger.info("Scheduler already initialized, skipping");
      return true;
    }

    // Start polling if not already running
    if (!this.isPolling) {
      this.startPolling();
    }

    this.initialized = true;
    return true;
  }

  /**
   * Start polling the database for schedules that need to be executed
   */
  startPolling() {
    logger.info("Starting database polling for schedules");
    this.isPolling = true;

    // Define the polling function
    const poll = async () => {
      if (!this.isPolling) return;

      try {
        await this.checkAndExecuteSchedules();
      } catch (error) {
        logger.error("Error in schedule polling:", error);
      } finally {
        // Schedule next poll only if polling is still active
        if (this.isPolling) {
          this.pollTimer = setTimeout(poll, this.pollingInterval);
        }
      }
    };

    // Start the initial poll
    poll();
  }

  /**
   * Stop polling the database
   */
  stopPolling() {
    logger.info("Stopping database polling for schedules");
    this.isPolling = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Check for schedules that need to be executed and run them
   */
  async checkAndExecuteSchedules() {
    const now = new Date();
    logger.info(`Checking for schedules to execute at ${now.toISOString()}`);

    try {
      // Find schedules due to run
      logger.info(
        `Querying for active schedules with nextRun <= ${now.toISOString()}`
      );
      const schedulesToRun = await prisma.schedule.findMany({
        where: {
          status: "active",
          nextRun: {
            lte: now,
          },
        },
        include: {
          recipients: true,
          parameters: true,
        },
      });

      logger.info(`Found ${schedulesToRun.length} schedules to execute`);

      // Log schedule IDs and nextRun times for debugging
      schedulesToRun.forEach((schedule) => {
        logger.info(
          `Schedule ${
            schedule.id
          }: nextRun = ${schedule.nextRun?.toISOString()}`
        );
      });

      // Also log all active schedules for comparison
      const allActive = await prisma.schedule.findMany({
        where: { status: "active" },
        select: { id: true, nextRun: true },
      });

      logger.info(`All active schedules: ${allActive.length}`);
      allActive.forEach((schedule) => {
        logger.info(
          `Active schedule ${
            schedule.id
          }: nextRun = ${schedule.nextRun?.toISOString()}`
        );
      });

      // Add debugging for when no schedules are found
      if (schedulesToRun.length === 0) {
        // Count active schedules
        const activeCount = await prisma.schedule.count({
          where: { status: "active" },
        });

        // Count schedules with future nextRun
        const futureCount = await prisma.schedule.count({
          where: {
            status: "active",
            nextRun: { gt: now },
          },
        });

        // Count schedules with null nextRun
        const nullCount = await prisma.schedule.count({
          where: {
            status: "active",
            nextRun: null,
          },
        });

        logger.info(
          `Debug - Active schedules: ${activeCount}, Future: ${futureCount}, Null nextRun: ${nullCount}`
        );

        // Check a sample of active schedules to see their nextRun times
        if (activeCount > 0) {
          const sampleSchedules = await prisma.schedule.findMany({
            where: { status: "active" },
            select: { id: true, name: true, nextRun: true },
            take: 5,
          });

          logger.info("Sample active schedules:", sampleSchedules);
        }
      }

      // Execute each schedule
      for (const schedule of schedulesToRun) {
        try {
          logger.info(
            `Starting execution of schedule ${schedule.id} (${schedule.name})`
          );
          await this.executeSchedule(schedule);
          logger.info(`Completed execution of schedule ${schedule.id}`);
        } catch (error) {
          logger.error(`Error executing schedule ${schedule.id}:`, error);
        }
      }

      return {
        checked: schedulesToRun.length,
        executed: schedulesToRun.length,
      };
    } catch (error) {
      logger.error("Error checking and executing schedules:", error);
      throw error;
    }
  }

  /**
   * Execute a specific schedule
   * @param {Object} schedule Schedule object with recipients and parameters
   * @returns {Promise<Object>} Execution results with success/failure counts
   */
  async executeSchedule(schedule) {
    logger.info(`Executing schedule ${schedule.id}: ${schedule.name}`);

    try {
      // Validate schedule has recipients
      if (!schedule.recipients || schedule.recipients.length === 0) {
        logger.warn(
          `Schedule ${schedule.id} has no recipients, skipping execution`
        );
        await this.updateScheduleAfterExecution(schedule);
        return { success: 0, failed: 0, details: [] };
      }

      // Check WhatsApp session before proceeding
      logger.info(`Verifying WhatsApp session ${schedule.sessionName}`);
      const sessionStatus = await wahaClient.checkSession(schedule.sessionName);
      if (!sessionStatus.isConnected) {
        logger.error(
          `WhatsApp session ${schedule.sessionName} is not connected. Status: ${sessionStatus.status}`
        );
        throw new Error(
          `WhatsApp session not connected: ${sessionStatus.status}`
        );
      }

      // Get the template
      logger.info(`Fetching template ${schedule.templateId}`);
      const template = await getTemplate(schedule.templateId);
      if (!template) {
        throw new Error(`Template ${schedule.templateId} not found`);
      }

      // Convert parameters array to object for easier access
      const paramValues = {};
      if (schedule.parameters && schedule.parameters.length > 0) {
        schedule.parameters.forEach((param) => {
          paramValues[param.paramId] = param.paramValue;
          logger.debug(`Parameter ${param.paramId} = "${param.paramValue}"`);
        });
      } else {
        logger.warn(`Schedule ${schedule.id} has no parameters`);
      }

      // Send messages
      let success = 0;
      let failed = 0;
      const details = [];
      const totalRecipients = schedule.recipients.length;

      logger.info(`Sending messages to ${totalRecipients} recipients`);

      // For each recipient
      for (const [index, recipientObj] of schedule.recipients.entries()) {
        const recipient = recipientObj.recipient;
        // Ensure recipient has @c.us suffix
        const formatted = formatPhoneNumber(recipient);

        logger.info(
          `Processing recipient ${
            index + 1
          }/${totalRecipients}: ${recipient} (formatted: ${formatted})`
        );

        try {
          // Build message with parameters
          let finalMessage = template.content;

          // Replace parameter placeholders with values
          Object.entries(paramValues).forEach(([paramId, value]) => {
            const regex = new RegExp(`\\{${paramId}\\}`, "g");
            finalMessage = finalMessage.replace(regex, value || `{${paramId}}`);
          });

          // Format bold text (adjust for WhatsApp formatting if needed)
          finalMessage = finalMessage.replace(/\*\*(.*?)\*\*/g, "*$1*");

          logger.debug(
            `Prepared message for ${formatted}: ${finalMessage.substring(
              0,
              50
            )}...`
          );

          // Send message through WhatsApp client
          logger.info(
            `Sending message to ${formatted} via session ${schedule.sessionName}`
          );
          const result = await wahaClient.sendText(
            schedule.sessionName, // Pass session name first
            formatted,
            finalMessage
          );

          success++;
          details.push({
            recipient: formatted,
            status: "sent",
            success: true,
            messageId: result?.id || null,
          });

          logger.info(
            `Successfully sent message to ${formatted} for schedule ${schedule.id}`
          );
        } catch (err) {
          failed++;
          details.push({
            recipient: formatted,
            status: "failed",
            success: false,
            error: err.message,
          });

          logger.error(
            `Failed to send message to ${formatted} for schedule ${schedule.id}: ${err.message}`
          );
          logger.debug(`Error details:`, err);
        }

        // Small delay between messages to avoid rate limiting
        if (index < totalRecipients - 1) {
          const delayMs = 2000;
          logger.debug(`Waiting ${delayMs}ms before sending next message`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      // Log summary
      logger.info(
        `Schedule ${schedule.id} execution completed: ${success} successful, ${failed} failed`
      );

      // Update history
      logger.info(`Adding execution history for schedule ${schedule.id}`);
      await this.addScheduleHistory(schedule.id, {
        successCount: success,
        failedCount: failed,
        details,
      });

      // Update schedule status and next run time
      logger.info(`Updating schedule ${schedule.id} after execution`);
      await this.updateScheduleAfterExecution(schedule);

      return { success, failed, details };
    } catch (error) {
      logger.error(`Critical error executing schedule ${schedule.id}:`, error);

      // Update history with failure
      try {
        logger.info(`Recording failure in history for schedule ${schedule.id}`);
        await this.addScheduleHistory(schedule.id, {
          successCount: 0,
          failedCount: schedule.recipients?.length || 0,
          details: [{ error: error.message || "Unknown error" }],
        });

        // Mark as failed if it's a one-time schedule
        if (schedule.scheduleType === "once") {
          logger.info(`Marking one-time schedule ${schedule.id} as failed`);
          await prisma.schedule.update({
            where: { id: Number(schedule.id) },
            data: { status: "failed" },
          });
        }
      } catch (historyError) {
        logger.error(
          `Failed to update history for schedule ${schedule.id}:`,
          historyError
        );
      }

      throw error; // Re-throw to be handled by caller
    }
  }

  /**
   * Add execution history entry for a schedule
   */
  async addScheduleHistory(scheduleId, results) {
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
      logger.error(`Error adding schedule history for ${scheduleId}:`, error);
      throw error;
    }
  }

  /**
   * Update schedule after execution
   */
  async updateScheduleAfterExecution(schedule) {
    try {
      const now = new Date();
      let nextRun = null;
      let status = schedule.status;

      // For one-time schedules, mark as completed
      if (schedule.scheduleType === "once") {
        status = "completed";
        logger.info(`One-time schedule ${schedule.id} marked as completed`);
      }
      // For recurring schedules, calculate next run time
      else if (schedule.scheduleType === "recurring") {
        try {
          // Use cronExpression to calculate next run
          const scheduleConfig = {
            cronExpression: schedule.cronExpression,
          };

          nextRun = calculateNextRunTime("recurring", scheduleConfig);
          logger.info(
            `Next run for recurring schedule ${schedule.id}: ${
              nextRun?.toISOString() || "null"
            }`
          );

          // Check if schedule has reached end date
          if (schedule.endDate && nextRun > new Date(schedule.endDate)) {
            status = "completed";
            nextRun = null;
            logger.info(
              `Recurring schedule ${schedule.id} reached end date, marked as completed`
            );
          }
        } catch (cronError) {
          logger.error(
            `Error calculating next run for schedule ${schedule.id}:`,
            cronError
          );
          status = "failed";
        }
      }

      // Update the schedule
      return await prisma.schedule.update({
        where: { id: Number(schedule.id) },
        data: {
          status,
          lastRun: now,
          nextRun,
        },
      });
    } catch (error) {
      logger.error(
        `Error updating schedule ${schedule.id} after execution:`,
        error
      );
      throw error;
    }
  }
}

// Singleton export
const schedulerService = new SchedulerService();

// Initialize the scheduler service in Node.js environments (non-browser)
if (typeof window === "undefined") {
  // Use a global flag to prevent multiple initializations
  if (!global.schedulerInitialized) {
    global.schedulerInitialized = true;
    schedulerService.init().catch((err) => {
      logger.error("Failed to initialize scheduler:", err);
    });
  }
}

export async function initializeSchedules() {
  return schedulerService.init();
}

export default schedulerService;
