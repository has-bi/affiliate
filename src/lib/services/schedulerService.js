// src/lib/services/schedulerService.js
import schedule from "node-schedule"; // Need to install node-schedule package
import {
  getAllSchedules,
  updateSchedule,
  addScheduleHistory,
  getScheduleById,
} from "../scheduleUtils";
import { fillTemplate, getTemplateById } from "../templateUtils";
import { formatPhoneNumber } from "../utils";

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.wahaApiUrl =
      process.env.NEXT_PUBLIC_WAHA_API_URL || "https://wabot.youvit.co.id";
  }

  // Initialize scheduler and load all active jobs
  async init() {
    console.log("Initializing scheduler service...");
    this.loadAllJobs();
  }

  // Load all scheduled jobs from storage
  loadAllJobs() {
    const schedules = getAllSchedules();

    // Filter only active/pending schedules
    const activeSchedules = schedules.filter(
      (s) => s.status === "active" || s.status === "pending"
    );

    console.log(`Loading ${activeSchedules.length} schedule(s)`);

    activeSchedules.forEach((scheduleData) => {
      this.scheduleJob(scheduleData);
    });
  }

  // Schedule a single job
  scheduleJob(scheduleData) {
    // Cancel any existing job for this schedule
    if (this.jobs.has(scheduleData.id)) {
      this.cancelJob(scheduleData.id);
    }

    try {
      let job;

      if (scheduleData.scheduleType === "once") {
        // One-time schedule
        const date = new Date(scheduleData.scheduleConfig.date);

        // Skip if date is in the past
        if (date <= new Date()) {
          console.log(
            `Schedule ${scheduleData.id} date is in the past, skipping`
          );
          updateSchedule(scheduleData.id, { status: "completed" });
          return;
        }

        job = schedule.scheduleJob(date, () => {
          this.executeSchedule(scheduleData.id);
        });
      } else if (scheduleData.scheduleType === "recurring") {
        // Recurring schedule with cron expression
        const { cronExpression, startDate, endDate } =
          scheduleData.scheduleConfig;

        const options = {};
        if (startDate) options.start = new Date(startDate);
        if (endDate) options.end = new Date(endDate);

        job = schedule.scheduleJob(cronExpression, () => {
          this.executeSchedule(scheduleData.id);
        });
      }

      if (job) {
        this.jobs.set(scheduleData.id, job);

        // Calculate next run
        const nextRun = job.nextInvocation();

        // Update schedule with active status and next run date
        updateSchedule(scheduleData.id, {
          status: "active",
          nextRun: nextRun ? nextRun.toISOString() : null,
        });

        console.log(
          `Schedule ${scheduleData.id} created successfully. Next run: ${nextRun}`
        );
      }
    } catch (error) {
      console.error(`Error scheduling job ${scheduleData.id}:`, error);
      updateSchedule(scheduleData.id, { status: "failed" });
    }
  }

  // Cancel a scheduled job
  cancelJob(scheduleId) {
    if (this.jobs.has(scheduleId)) {
      const job = this.jobs.get(scheduleId);
      job.cancel();
      this.jobs.delete(scheduleId);
      console.log(`Schedule ${scheduleId} cancelled`);
      return true;
    }
    return false;
  }

  // Execute a scheduled job
  async executeSchedule(scheduleId) {
    console.log(`Executing schedule ${scheduleId}`);

    try {
      // Get fresh schedule data
      const scheduleData = getScheduleById(scheduleId);

      if (!scheduleData) {
        console.error(`Schedule ${scheduleId} not found`);
        return;
      }

      // Get template data
      const template = getTemplateById(scheduleData.templateId);

      if (!template) {
        console.error(
          `Template ${scheduleData.templateId} not found for schedule ${scheduleId}`
        );
        addScheduleHistory(scheduleId, {
          success: 0,
          failed: scheduleData.recipients.length,
          details: [
            { error: `Template not found: ${scheduleData.templateId}` },
          ],
        });
        return;
      }

      // Fill template with parameters
      const message = fillTemplate(
        scheduleData.templateId,
        scheduleData.paramValues
      );

      if (!message) {
        console.error(`Failed to fill template for schedule ${scheduleId}`);
        addScheduleHistory(scheduleId, {
          success: 0,
          failed: scheduleData.recipients.length,
          details: [{ error: "Failed to fill template" }],
        });
        return;
      }

      // Send messages to all recipients
      const results = await Promise.allSettled(
        scheduleData.recipients.map(async (recipient) => {
          try {
            // Format phone number if needed
            const formattedChatId = recipient.includes("@c.us")
              ? recipient
              : `${formatPhoneNumber(recipient)}@c.us`;

            // Send message directly to WAHA API
            const wahaApiUrl =
              process.env.NEXT_PUBLIC_WAHA_API_URL ||
              "https://wabot.youvit.co.id";
            const response = await fetch(`${wahaApiUrl}/api/sendText`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                chatId: formattedChatId,
                text: message,
                session: scheduleData.sessionName,
              }),
            });

            if (!response.ok) {
              let errorMessage = "Failed to send message";
              try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
              } catch (e) {
                // If response is not JSON, try to get text
                errorMessage = (await response.text()) || errorMessage;
              }
              throw new Error(errorMessage);
            }

            const result = await response.json();

            return {
              recipient: formattedChatId,
              success: true,
              messageId: result.id || "unknown",
            };
          } catch (error) {
            return {
              recipient,
              success: false,
              error: error.message || "Failed to send message",
            };
          }
        })
      );

      // Process results
      const successResults = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      );
      const failedResults = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.success)
      );

      // Update history
      addScheduleHistory(scheduleId, {
        success: successResults.length,
        failed: failedResults.length,
        details: [
          ...successResults.map((r) => r.value),
          ...failedResults.map((r) =>
            r.status === "rejected"
              ? { success: false, error: r.reason }
              : r.value
          ),
        ],
      });

      // Update status for one-time schedules
      if (scheduleData.scheduleType === "once") {
        updateSchedule(scheduleId, { status: "completed" });
        this.jobs.delete(scheduleId);
      } else {
        // Update next run time for recurring schedules
        const job = this.jobs.get(scheduleId);
        if (job) {
          const nextRun = job.nextInvocation();
          updateSchedule(scheduleId, {
            nextRun: nextRun ? nextRun.toISOString() : null,
          });
        }
      }

      console.log(
        `Schedule ${scheduleId} executed. Success: ${successResults.length}, Failed: ${failedResults.length}`
      );
    } catch (error) {
      console.error(`Error executing schedule ${scheduleId}:`, error);
      addScheduleHistory(scheduleId, {
        success: 0,
        failed: 1,
        details: [{ error: error.message || "Unknown error during execution" }],
      });
      updateSchedule(scheduleId, { status: "failed" });
    }
  }

  // Recreate job with updated data
  updateJob(scheduleId) {
    const scheduleData = getScheduleById(scheduleId);
    if (scheduleData) {
      this.scheduleJob(scheduleData);
      return true;
    }
    return false;
  }
}

// Singleton instance
const schedulerService = new SchedulerService();

export default schedulerService;
