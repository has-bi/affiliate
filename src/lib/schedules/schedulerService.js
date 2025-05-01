// src/lib/schedules/schedulerService.js
import prisma from "@/lib/db/prisma"; // Correct import
import { calculateNextRunTime } from "./cronUtils";
import { getTemplate } from "@/lib/templates/templateUtils"; // Correct import name
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

      // Execute each schedule
      for (const schedule of schedulesToRun) {
        try {
          await this.executeSchedule(schedule);
        } catch (error) {
          logger.error(`Error executing schedule ${schedule.id}:`, error);
        }
      }
    } catch (error) {
      logger.error("Error checking and executing schedules:", error);
    }
  }

  /**
   * Execute a specific schedule
   */
  async executeSchedule(schedule) {
    logger.info(`Executing schedule ${schedule.id}`);

    try {
      // Get the template (using the correct function name from templateUtils)
      const template = await getTemplate(schedule.templateId);
      if (!template) {
        throw new Error(`Template ${schedule.templateId} not found`);
      }

      // Convert parameters array to object for easier access
      const paramValues = {};
      schedule.parameters.forEach((param) => {
        paramValues[param.paramId] = param.paramValue;
      });

      // Send messages
      let success = 0;
      let failed = 0;
      const details = [];

      // For each recipient
      for (const recipientObj of schedule.recipients) {
        const recipient = recipientObj.recipient;
        const formatted = formatPhoneNumber(recipient);

        try {
          // Build message with parameters
          let finalMessage = template.content;

          // Replace parameter placeholders with values
          Object.entries(paramValues).forEach(([paramId, value]) => {
            const regex = new RegExp(`\\{${paramId}\\}`, "g");
            finalMessage = finalMessage.replace(regex, value || `{${paramId}}`);
          });

          // Format bold text
          finalMessage = finalMessage.replace(/\*\*(.*?)\*\*/g, "$1");

          // Send message through WhatsApp client
          await wahaClient.sendText(
            schedule.sessionName, // Pass session name first
            formatted,
            finalMessage
          );

          success++;
          details.push({ recipient, status: "sent" });
          logger.info(
            `Message sent to ${recipient} for schedule ${schedule.id}`
          );
        } catch (err) {
          failed++;
          details.push({ recipient, error: err.message });
          logger.error(
            `Failed to send message to ${recipient} for schedule ${schedule.id}:`,
            err
          );
        }

        // Small delay between messages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Update history
      await this.addScheduleHistory(schedule.id, {
        successCount: success,
        failedCount: failed,
        details,
      });

      // Update schedule status and next run time
      await this.updateScheduleAfterExecution(schedule);

      return { success, failed, details };
    } catch (error) {
      logger.error(`Error executing schedule ${schedule.id}:`, error);

      // Update history with failure
      await this.addScheduleHistory(schedule.id, {
        successCount: 0,
        failedCount: schedule.recipients?.length || 0,
        details: [{ error: error.message }],
      });

      // Mark as failed if it's a one-time schedule
      if (schedule.scheduleType === "once") {
        await prisma.schedule.update({
          where: { id: Number(schedule.id) },
          data: { status: "failed" },
        });
      }

      throw error;
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
      }
      // For recurring schedules, calculate next run time
      else if (schedule.scheduleType === "recurring") {
        try {
          // Use cronExpression to calculate next run
          const scheduleConfig = {
            cronExpression: schedule.cronExpression,
          };

          nextRun = calculateNextRunTime("recurring", scheduleConfig);

          // Check if schedule has reached end date
          if (schedule.endDate && nextRun > new Date(schedule.endDate)) {
            status = "completed";
            nextRun = null;
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
