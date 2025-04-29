// src/lib/services/schedulerService.js
import schedule from "node-schedule";
import baileysClient from "@/lib/baileysClient";
import {
  getAllSchedules,
  updateSchedule,
  addScheduleHistory,
  getScheduleById,
} from "@/lib/scheduleUtils";
import {
  getTemplateById,
  getFinalMessageForContact,
} from "@/lib/templateUtils";
import { formatPhoneNumber } from "@/lib/utils";

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
