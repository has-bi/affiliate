// src/lib/schedules/schedulerService.js
import schedule from "node-schedule";
import {
  getAllSchedules,
  updateSchedule,
  addScheduleHistory,
  getScheduleById,
} from "./scheduleUtils";
import {
  getTemplate,
  fillTemplateContent,
} from "@/lib/templates/templateUtils";
import { formatPhoneNumber } from "@/lib/utils";

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.wahaApiUrl =
      process.env.NEXT_PUBLIC_WAHA_API_URL || "https://wabot.youvit.co.id";
  }

  // Initialize scheduler and load all active jobs
  async init() {
    console.log("Initializing scheduler service...");
    console.log(
      "Server timezone:",
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
    console.log("Current server time:", new Date().toISOString());
    console.log("Local time:", new Date().toLocaleString());

    try {
      await this.loadAllJobs();
      console.log("Successfully loaded all scheduled jobs");
    } catch (error) {
      console.error("Error initializing scheduler:", error);
    }
  }

  // Load all scheduled jobs from storage
  async loadAllJobs() {
    console.log("Loading schedules from database...");
    const schedules = await getAllSchedules();

    // Filter only active/pending schedules
    const activeSchedules = schedules.filter(
      (s) => s.status === "active" || s.status === "pending"
    );

    console.log(
      `Loading ${activeSchedules.length} active schedule(s) from database`
    );

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
      console.log(
        `\n======= Creating job for schedule ${scheduleData.id} =======`
      );
      console.log(`Schedule type: ${scheduleData.scheduleType}`);
      console.log(`Schedule config:`, scheduleData.scheduleConfig);

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

        console.log(`One-time job scheduled for: ${date.toISOString()}`);
      } else if (scheduleData.scheduleType === "recurring") {
        // Recurring schedule with cron expression
        const cronExpression = scheduleData.scheduleConfig.cronExpression;
        const dayOfWeek = cronExpression.split(" ")[4]; // Get day-of-week part

        // Create job scheduling options
        const options = {};
        if (scheduleData.scheduleConfig.startDate) {
          options.start = new Date(scheduleData.scheduleConfig.startDate);
          console.log(`Start date: ${options.start.toISOString()}`);
        }
        if (scheduleData.scheduleConfig.endDate) {
          options.end = new Date(scheduleData.scheduleConfig.endDate);
          console.log(`End date: ${options.end.toISOString()}`);
        }

        // Create the recurring job with detailed error handling
        try {
          // Parse cron expression to validate
          const cronParts = cronExpression.split(" ");
          if (!cronExpression || cronParts.length !== 5) {
            throw new Error(
              `Invalid cron expression: "${cronExpression}" - must have 5 parts`
            );
          }

          console.log(`Cron expression parts: [${cronParts.join(", ")}]`);

          // Special handling for the nth weekday of month syntax (e.g., "1#3" for third Monday)
          if (dayOfWeek.includes("#")) {
            console.log(`Detected special day-of-week format: ${dayOfWeek}`);

            // Extract the day of week and the occurrence number
            const [dow, week] = dayOfWeek
              .split("#")
              .map((n) => parseInt(n, 10));

            // Create a job that checks if it's the nth occurrence of that weekday in the month
            job = schedule.scheduleJob(
              cronParts.slice(0, 4).join(" ") + " " + dow,
              function () {
                const now = new Date();
                const dayOfMonth = now.getDate();
                const weekOfMonth = Math.ceil(dayOfMonth / 7);

                // Only run if this is the nth occurrence specified
                if (weekOfMonth === week) {
                  console.log(
                    `\n>>> Recurring job triggered for schedule ${
                      scheduleData.id
                    } at ${new Date().toISOString()} - nth weekday of month <<<`
                  );
                  this.executeSchedule(scheduleData.id);
                }
              }.bind(this)
            );
          } else {
            job = schedule.scheduleJob(cronExpression, options, () => {
              console.log(
                `\n>>> Recurring job triggered for schedule ${
                  scheduleData.id
                } at ${new Date().toISOString()} <<<`
              );
              this.executeSchedule(scheduleData.id);
            });
          }

          if (!job) {
            throw new Error("Failed to create job, null returned");
          }

          console.log(`Recurring job created successfully`);
        } catch (cronError) {
          console.error(
            `Error with cron expression "${cronExpression}":`,
            cronError
          );
          updateSchedule(scheduleData.id, {
            status: "failed",
            error: `Invalid cron expression: ${cronError.message}`,
          });
          return;
        }
      }

      if (job) {
        this.jobs.set(scheduleData.id, job);

        // Calculate next run
        const nextRun = job.nextInvocation();
        if (nextRun) {
          console.log(
            `Next run for schedule ${scheduleData.id}: ${nextRun.toISOString()}`
          );
          console.log(`Next run in your timezone: ${nextRun.toLocaleString()}`);
        } else {
          console.log(
            `Unable to calculate next run for schedule ${scheduleData.id}`
          );
        }

        // Update schedule with active status and next run date
        updateSchedule(scheduleData.id, {
          status: "active",
          nextRun: nextRun ? nextRun.toISOString() : null,
        });

        console.log(`Schedule ${scheduleData.id} created successfully.`);
        console.log(`=================================================\n`);
      } else {
        console.error(`Failed to create job for schedule ${scheduleData.id}`);
        updateSchedule(scheduleData.id, {
          status: "failed",
          error: "Failed to create schedule job",
        });
      }
    } catch (error) {
      console.error(`Error scheduling job ${scheduleData.id}:`, error);
      updateSchedule(scheduleData.id, {
        status: "failed",
        error: error.message || "Unknown error",
      });
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
    console.log(`\n=========== EXECUTING SCHEDULE ${scheduleId} ===========`);
    console.log(`Current time: ${new Date().toISOString()}`);
    console.log(`Local time: ${new Date().toLocaleString()}`);

    try {
      // Get fresh schedule data - need to await since it's from database
      const scheduleData = await getScheduleById(scheduleId);

      if (!scheduleData) {
        console.error(`[ERROR] Schedule ${scheduleId} not found`);
        return;
      }

      console.log(`Schedule name: ${scheduleData.name}`);
      console.log(`Template ID: ${scheduleData.templateId}`);
      console.log(`Recipients:`, scheduleData.recipients);

      // Get template data - need to await since it's from database
      console.log(`Fetching template...`);
      const template = await getTemplate(scheduleData.templateId);

      if (!template) {
        console.error(
          `[ERROR] Template ${scheduleData.templateId} not found for schedule ${scheduleId}`
        );

        // Add safety check for recipients array
        const recipientCount = scheduleData.recipients?.length || 0;

        await addScheduleHistory(scheduleId, {
          success: 0,
          failed: recipientCount,
          details: [
            { error: `Template not found: ${scheduleData.templateId}` },
          ],
        });
        return;
      }

      console.log(`Template found: ${template.name}`);

      // Fill template with parameters
      console.log(
        `Filling template with parameters:`,
        scheduleData.paramValues
      );
      const message = fillTemplateContent(
        template.content,
        scheduleData.paramValues
      );

      if (!message) {
        console.error(
          `[ERROR] Failed to fill template for schedule ${scheduleId}`
        );
        await addScheduleHistory(scheduleId, {
          success: 0,
          failed: scheduleData.recipients?.length || 0,
          details: [{ error: "Failed to fill template" }],
        });
        return;
      }

      console.log(`Message prepared successfully`);
      console.log(`Message preview: ${message.substring(0, 100)}...`);

      // Send messages to all recipients
      console.log(
        `Preparing to send messages to ${
          scheduleData.recipients?.length || 0
        } recipients...`
      );

      // Safety check for recipients
      if (!scheduleData.recipients || scheduleData.recipients.length === 0) {
        console.error(`[ERROR] No recipients found for schedule ${scheduleId}`);
        await addScheduleHistory(scheduleId, {
          success: 0,
          failed: 0,
          details: [{ error: "No recipients found" }],
        });
        return;
      }

      console.log(`Starting message sending process...`);

      try {
        const results = await Promise.allSettled(
          scheduleData.recipients.map(async (recipient) => {
            try {
              console.log(`Processing recipient: ${recipient}`);

              // Format phone number if needed
              const formattedChatId = recipient.includes("@c.us")
                ? recipient
                : `${formatPhoneNumber(recipient)}@c.us`;

              console.log(`Formatted chat ID: ${formattedChatId}`);

              // Send message directly to WAHA API
              const wahaApiUrl =
                process.env.NEXT_PUBLIC_WAHA_API_URL ||
                "https://wabot.youvit.co.id";

              const wahaSessionName =
                process.env.NEXT_PUBLIC_WAHA_SESSION || "hasbi-test";

              const requestBody = {
                chatId: formattedChatId,
                text: message,
                session: scheduleData.sessionName,
              };

              console.log(`Making API request to ${wahaApiUrl}/api/sendText`);
              console.log(
                `Request body:`,
                JSON.stringify(requestBody, null, 2)
              );
              console.log(`Session name: ${scheduleData.sessionName}`);

              const response = await fetch(`${wahaApiUrl}/api/sendText`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify(requestBody),
              });

              console.log(`Response status: ${response.status}`);

              let responseData;

              try {
                responseData = await response.json();
                console.log(
                  `Response data:`,
                  JSON.stringify(responseData, null, 2)
                );
              } catch (parseError) {
                console.error(`Failed to parse response JSON:`, parseError);
                const responseText = await response.text();
                console.log(`Raw response text:`, responseText);
                throw new Error(`Invalid JSON response: ${responseText}`);
              }

              if (!response.ok) {
                // Get more detailed error information
                const errorMessage =
                  responseData.error ||
                  responseData.message ||
                  "Failed to send message";
                console.error(
                  `[ERROR] API response error for ${formattedChatId}:`
                );
                console.error(`- Status: ${response.status}`);
                console.error(`- Error message: ${errorMessage}`);
                console.error(`- Full response:`, responseData);

                // Check for specific error types
                if (response.status === 404) {
                  throw new Error(
                    `Session not found: ${scheduleData.sessionName}`
                  );
                } else if (response.status === 400) {
                  throw new Error(`Bad request: ${errorMessage}`);
                } else if (response.status === 401 || response.status === 403) {
                  throw new Error(`Authentication error: ${errorMessage}`);
                } else {
                  throw new Error(errorMessage);
                }
              }

              console.log(`✅ Message sent successfully to ${formattedChatId}`);
              return {
                recipient: formattedChatId,
                success: true,
                messageId: responseData.id || "unknown",
              };
            } catch (error) {
              console.error(`❌ Failed to send to ${recipient}:`);
              console.error(`- Error type: ${error.constructor.name}`);
              console.error(`- Error message: ${error.message}`);
              console.error(`- Error stack:`, error.stack);

              return {
                recipient,
                success: false,
                error: error.message || "Failed to send message",
              };
            }
          })
        );

        console.log(`All messages processed. Analyzing results...`);

        // Process results
        const successResults = results.filter(
          (r) => r.status === "fulfilled" && r.value.success
        );
        const failedResults = results.filter(
          (r) =>
            r.status === "rejected" ||
            (r.status === "fulfilled" && !r.value.success)
        );

        console.log(`Results summary:`);
        console.log(`- Total processed: ${results.length}`);
        console.log(`- Successful: ${successResults.length}`);
        console.log(`- Failed: ${failedResults.length}`);

        // Update history
        const historyEntry = {
          success: successResults.length,
          failed: failedResults.length,
          details: [
            ...successResults.map((r) => r.value),
            ...failedResults.map((r) =>
              r.status === "rejected"
                ? { success: false, error: r.reason?.message || r.reason }
                : r.value
            ),
          ],
        };

        console.log(`Creating history entry:`, historyEntry);
        await addScheduleHistory(scheduleId, historyEntry);

        // Update status for one-time schedules
        if (scheduleData.scheduleType === "once") {
          console.log(
            `One-time schedule ${scheduleId} completed, marking as complete`
          );
          await updateSchedule(scheduleId, { status: "completed" });
          this.jobs.delete(scheduleId);
        } else {
          // Update next run time for recurring schedules
          const job = this.jobs.get(scheduleId);
          if (job) {
            const nextRun = job.nextInvocation();
            if (nextRun) {
              console.log(
                `Next run time for ${scheduleId}: ${nextRun.toISOString()}`
              );
              console.log(
                `Next run in local time: ${nextRun.toLocaleString()}`
              );
            } else {
              console.log(
                `[WARNING] Unable to calculate next run for ${scheduleId}`
              );
            }
            await updateSchedule(scheduleId, {
              nextRun: nextRun ? nextRun.toISOString() : null,
            });
          }
        }

        console.log(`=========== EXECUTION COMPLETE ===========\n`);
      } catch (error) {
        console.error(`[ERROR] Error in sending process:`, error);
        console.error(`Error stack:`, error.stack);
        throw error; // Re-throw to be caught by outer try-catch
      }
    } catch (error) {
      console.error(`[ERROR] Error in sending process:`, error);
      console.error(`Error type: ${error.constructor.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack:`, error.stack);
      throw error;
    }
  }

  // Recreate job with updated data
  async updateJob(scheduleId) {
    const scheduleData = await getScheduleById(scheduleId);
    if (scheduleData) {
      this.scheduleJob(scheduleData);
      return true;
    }
    return false;
  }
}

// Singleton instance
const schedulerService = new SchedulerService();

// Initialize immediately when the module is loaded
console.log("[SchedulerService] Initializing scheduler on module load...");
schedulerService.init().catch((error) => {
  console.error("[SchedulerService] Failed to initialize:", error);
});

export async function initializeSchedules() {
  console.log("[SchedulerService] Manual initialization requested");
  await schedulerService.init();
  return true;
}

export default schedulerService;
