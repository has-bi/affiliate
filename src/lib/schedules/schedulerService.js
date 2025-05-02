// src/lib/services/schedulerService.js
import schedule from "node-schedule";
import baileysClient from "@/lib/whatsapp/wahaClient";
import {
  getAllSchedules,
  updateSchedule,
  addScheduleHistory,
  getScheduleById,
} from "@/lib/schedules/scheduleUtils";
import {
  getTemplateById,
  getFinalMessageForContact,
} from "@/lib/templates/templateUtils";
import { formatPhoneNumber, createLogger } from "@/lib/utils";

const logger = createLogger("[API][BulkMessages]");

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  async init() {
    console.log("[Scheduler] Loading active schedules...");

    const schedules = await getAllSchedules();
    schedules
      .filter((s) => s.status === "active")
      .forEach((s) => this.scheduleJob(s));

    console.log(`[Scheduler] Loaded ${schedules.length} schedules.`);
  }

  scheduleJob(scheduleData) {
    // Cancel previous instance if rescheduling
    if (this.jobs.has(scheduleData.id)) {
      this.cancelJob(scheduleData.id);
    }

    try {
      let job;

      // ONE-TIME SCHEDULE
      if (scheduleData.scheduleType === "once") {
        const date = new Date(scheduleData.scheduleConfig.date);

        job = schedule.scheduleJob(date, () => this._runJob(scheduleData.id));
        console.log(`Created one-time job for schedule ${scheduleData.id}`);
      }
      // RECURRING SCHEDULE
      else if (scheduleData.scheduleType === "recurring") {
        const cron = scheduleData.scheduleConfig.cronExpression;

        job = schedule.scheduleJob(cron, () => this._runJob(scheduleData.id));
        console.log(`Created recurring job for schedule ${scheduleData.id}`);
      }

      if (!job) throw new Error("Failed to create node-schedule job");

      this.jobs.set(scheduleData.id, job);
      const nextRun = job.nextInvocation();
      updateSchedule(scheduleData.id, {
        nextRun: nextRun ? nextRun.toISOString() : null,
      });
    } catch (err) {
      console.error(
        `[Scheduler] Error registering schedule ${scheduleData.id}:`,
        err
      );
      updateSchedule(scheduleData.id, { status: "failed" });
    }
  }

  cancelJob(scheduleId) {
    const job = this.jobs.get(scheduleId);
    if (job) job.cancel();
    this.jobs.delete(scheduleId);
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

  async _runJob(scheduleId) {
    console.log(`\n===== Executing schedule ${scheduleId} =====`);

    const scheduleData = await getScheduleById(scheduleId);
    if (!scheduleData) {
      console.error(`Schedule ${scheduleId} not found - cancelling job.`);
      this.cancelJob(scheduleId);
      return;
    }

    try {
      // Load template
      const template = await getTemplateById(scheduleData.templateId);
      if (!template) throw new Error("Template not found");

      let success = 0;
      let failed = 0;
      const details = [];

      for (const recipient of scheduleData.recipients) {
        const formatted = formatPhoneNumber(recipient);

        try {
          // Build message (with parameters)
          const text = getFinalMessageForContact(
            template.content,
            { phone: formatted }, // Basic contact info
            scheduleData.paramValues // Static parameters
          );

          // Send message
          await baileysClient.sendText(
            scheduleData.sessionName,
            formatted,
            text
          );

          success++;
          details.push({ phone: recipient, status: "sent" });
        } catch (err) {
          failed++;
          details.push({ phone: recipient, error: err.message });
        }

        // Small delay between messages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Update history
      await addScheduleHistory(scheduleId, {
        successCount: success,
        failedCount: failed,
        details,
      });

      // Update last/next run timestamps
      const job = this.jobs.get(scheduleId);
      const nextRun = job?.nextInvocation() || null;
      await updateSchedule(scheduleId, {
        lastRun: new Date().toISOString(),
        nextRun: nextRun ? nextRun.toISOString() : null,
      });

      console.log(
        `Schedule ${scheduleId} finished - OK:${success} NOK:${failed}`
      );
    } catch (err) {
      console.error(`[Scheduler] Fatal error in schedule ${scheduleId}:`, err);
      await addScheduleHistory(scheduleId, {
        successCount: 0,
        failedCount: scheduleData.recipients.length,
        details: [{ error: err.message }],
      });
      await updateSchedule(scheduleId, { status: "failed" });
    }
  }
}

// Singleton export & immediate init
const schedulerService = new SchedulerService();
console.log("[Scheduler] Initializing...");
schedulerService.init().catch((e) => {
  console.error("[Scheduler] Init failed:", e);
});

export async function initializeSchedules() {
  return schedulerService.init();
}

export default schedulerService;
