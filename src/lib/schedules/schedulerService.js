import { CronJob } from "cron";
import { validateCronExpression } from "@/lib/config/cronHelper";
import {
  getAllSchedules,
  updateSchedule,
  addScheduleHistory,
  getScheduleById,
} from "./scheduleUtils";
import {
  getTemplate,
  processAllParameters,
} from "@/lib/templates/templateUtils";
import { phoneKey } from "@/lib/utils";
import { validateAndFormatPhone } from "@/lib/utils/phoneValidator";
import { getActiveAffiliates } from "@/lib/sheets/spreadsheetService";
import wahaClient from "@/lib/whatsapp/wahaClient";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.executionLocks = new Map();
    this.wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_API_URL;
    this.wahaApiKey = process.env.NEXT_PUBLIC_WAHA_API_KEY;
    this.delayBetweenSendsMs = Number.parseInt(
      process.env.SCHEDULE_SEND_DELAY_MS || "250",
      10
    );
    if (!Number.isFinite(this.delayBetweenSendsMs) || this.delayBetweenSendsMs < 0) {
      this.delayBetweenSendsMs = 0;
    }

    // Log time zone information for debugging
    console.log(
      "Server timezone:",
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
    console.log("Current server time:", new Date().toISOString());
    console.log("Local time:", new Date().toLocaleString());
  }

  // Initialize scheduler and load all active jobs
  async init() {
    console.log("Initializing scheduler service...");

    // Clear any existing jobs and locks to prevent duplicates
    this.jobs.forEach((job) => job.stop());
    this.jobs.clear();
    this.executionLocks.clear();
    console.log("Cleared all existing jobs and locks");

    // Log timezone info
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

    // Process each schedule sequentially to avoid race conditions
    for (const scheduleData of activeSchedules) {
      await this.scheduleJob(scheduleData);
    }
  }

  // Validate cron expression to ensure proper format
  validateCronExpression(cronExpression, scheduleType) {
    const parts = cronExpression.split(" ");

    if (parts.length !== 5) {
      console.error(`Invalid cron parts length: ${parts.length}, expected 5`);
      return false;
    }

    // For daily schedules at specific time
    if (scheduleType === "daily") {
      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

      // Minute and hour should be specific numbers
      // Day of month, month, and day of week should be * for daily
      const isValid =
        /^\d+$/.test(minute) &&
        /^\d+$/.test(hour) &&
        dayOfMonth === "*" &&
        month === "*" &&
        dayOfWeek === "*";

      if (!isValid) {
        console.error(`Invalid daily cron format: ${cronExpression}`);
        console.error(`Expected format for daily: MM HH * * *`);
      }

      return isValid;
    }

    return true; // For other types
  }

  // Ensure only one job exists per schedule
  ensureSingleJob(scheduleId, job) {
    // Cancel any existing job first
    this.cancelJob(scheduleId);

    // Double-check no job exists
    if (this.jobs.has(scheduleId)) {
      console.warn(
        `Job for schedule ${scheduleId} still exists after cancellation, forcing removal`
      );
      this.jobs.delete(scheduleId);
    }

    // Store the new job
    this.jobs.set(scheduleId, job);

    // Use getCronTime().getNextDate() to get the next run date
    const nextDate = job.nextDate();
    if (nextDate) {
      console.log(
        `Job for schedule ${scheduleId} registered with next run: ${nextDate.toISO()}`
      );
      console.log(
        `Next run in your timezone: ${nextDate.toLocal().toString()}`
      );
    } else {
      console.log(`Unable to get next run date for schedule ${scheduleId}`);
    }

    return job;
  }

  // Schedule a single job with proper error handling and validation
  async scheduleJob(scheduleData) {
    // First, aggressively cancel any existing job
    this.cancelJob(scheduleData.id);

    // Also clear any execution locks that might be lingering
    this.executionLocks.delete(scheduleData.id);

    try {
      let job;
      console.log(
        `\n======= Creating job for schedule ${scheduleData.id} =======`
      );
      console.log(`Schedule type: ${scheduleData.scheduleType}`);
      console.log(
        `Schedule config:`,
        JSON.stringify(scheduleData.scheduleConfig, null, 2)
      );

      if (scheduleData.scheduleType === "once") {
        // One-time schedule
        const date = new Date(scheduleData.scheduleConfig.date);

        // Validate date
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date: ${scheduleData.scheduleConfig.date}`);
        }

        // Skip if date is in the past
        if (date <= new Date()) {
          console.log(
            `Schedule ${scheduleData.id} date is in the past, skipping`
          );
          await updateSchedule(scheduleData.id, { status: "completed" });
          return;
        }

        // Create one-time job with unique handler using the Date object
        console.log(
          `Creating one-time job for: ${date.toISOString()} (${date.toLocaleString()})`
        );

        // Create a function for execution
        const executeOnce = () => {
          const executionTime = new Date();
          console.log(
            `\n>>> One-time job executed at ${executionTime.toISOString()} for schedule ${
              scheduleData.id
            } <<<`
          );

          // Execute once then mark as completed
          this.executeSchedule(scheduleData.id);

          // Immediately cancel this job to prevent duplicates
          this.cancelJob(scheduleData.id);
        };

        // Create a job using the CronJob constructor with Date object
        job = new CronJob(date, executeOnce, null, true, "Asia/Jakarta");
      } // In schedulerService.js - focus on the recurring job section:
      else if (scheduleData.scheduleType === "recurring") {
        // Recurring schedule with cron expression
        let cronExpression;

        // Ensure we're getting a valid cron expression string
        if (typeof scheduleData.scheduleConfig?.cronExpression === "string") {
          cronExpression = scheduleData.scheduleConfig.cronExpression;
        } else if (typeof scheduleData.cronExpression === "string") {
          // Fallback to directly using cronExpression from the root object
          cronExpression = scheduleData.cronExpression;
        } else {
          throw new Error(
            `Missing or invalid cron expression for recurring schedule ${scheduleData.id}`
          );
        }

        // Enhanced validation and logging
        if (!cronExpression || typeof cronExpression !== "string") {
          throw new Error(
            `Invalid cron expression type for schedule ${
              scheduleData.id
            }: ${typeof cronExpression}`
          );
        }

        // Log the exact string and type to debug any issues
        console.log(
          `Raw cron expression: "${cronExpression}" (${typeof cronExpression})`
        );

        // Split and verify we have 5 parts
        const cronParts = cronExpression.split(/\s+/);
        console.log(
          `Cron parts (${cronParts.length}): [${cronParts.join(", ")}]`
        );

        // Validate with utility function
        if (!validateCronExpression(cronExpression)) {
          console.error(
            `Invalid cron expression: "${cronExpression}" for schedule ${scheduleData.id}`
          );
          throw new Error(
            `Invalid cron expression: "${cronExpression}" - must have 5 properly formatted parts`
          );
        }

        // Clean any potential double spaces or formatting issues
        const cleanedCronExpression = cronParts.join(" ");
        console.log(`Cleaned cron expression: "${cleanedCronExpression}"`);

        // Create the recurring job execution function
        const executeRecurring = () => {
          // Log execution with timestamp for tracking
          const executionTime = new Date();
          console.log(
            `\n>>> Recurring job executed at ${executionTime.toISOString()} for schedule ${
              scheduleData.id
            } <<<`
          );

          // Execute the schedule exactly once
          this.executeSchedule(scheduleData.id);
        };

        // Create the job using the most direct constructor form to avoid issues
        try {
          job = new CronJob(
            cleanedCronExpression, // cronTime
            executeRecurring, // onTick
            null, // onComplete (null = no completion handler)
            true, // start
            "Asia/Jakarta" // timeZone
          );
          console.log(
            `Created recurring job with cron: "${cleanedCronExpression}"`
          );
        } catch (cronError) {
          console.error(`Error creating cron job: ${cronError.message}`);
          console.error(`Error stack:`, cronError.stack);

          // Try to provide a helpful error message
          if (cronError.message.includes("Invalid cron pattern")) {
            throw new Error(
              `Invalid cron pattern: "${cleanedCronExpression}" - ${cronError.message}`
            );
          } else {
            throw cronError;
          }
        }
      }

      // Store the job with safety check
      if (job) {
        // Use the utility method to ensure only one job
        this.ensureSingleJob(scheduleData.id, job);

        // Calculate next run using the nextDate() method if available
        let nextRunInfo = "unknown";
        try {
          const nextDate = job.nextDate();
          if (nextDate) {
            console.log(
              `Next run for schedule ${scheduleData.id}: ${nextDate.toISO()}`
            );
            console.log(
              `Next run in local time: ${nextDate.toLocal().toString()}`
            );

            nextRunInfo = nextDate.toJSDate().toISOString();

            // Update schedule with active status and next run date
            await updateSchedule(scheduleData.id, {
              status: "active",
              nextRun: nextRunInfo,
            });
          } else {
            console.warn(
              `Unable to calculate next run for schedule ${scheduleData.id}`
            );

            // Update status even without next run date
            await updateSchedule(scheduleData.id, {
              status: "active",
            });
          }
        } catch (nextDateError) {
          console.error(
            `Error calculating next run date: ${nextDateError.message}`
          );

          // Still update status
          await updateSchedule(scheduleData.id, {
            status: "active",
          });
        }

        console.log(`Schedule ${scheduleData.id} created successfully.`);
        console.log(`=================================================\n`);
      } else {
        throw new Error("Job creation returned null or undefined");
      }
    } catch (error) {
      console.error(`Error scheduling job ${scheduleData.id}:`, error);
      await updateSchedule(scheduleData.id, {
        status: "failed",
        error: error.message || "Unknown error",
      });
    }
  }

  // Cancel a scheduled job
  cancelJob(scheduleId) {
    if (this.jobs.has(scheduleId)) {
      const job = this.jobs.get(scheduleId);
      job.stop();
      this.jobs.delete(scheduleId);
      console.log(`Schedule ${scheduleId} cancelled`);
      return true;
    }
    return false;
  }

  // Execute a scheduled job with duplicate prevention
  async executeSchedule(scheduleId) {
    // Use a unique execution ID for each run to track in logs
    const executionId = `${scheduleId}-${Date.now()}`;

    // Check if already running
    if (this.executionLocks.get(scheduleId)) {
      console.warn(
        `[DUPLICATE] Execution prevented for schedule ${scheduleId} (${executionId}) - already running`
      );
      return;
    }

    // Set lock and track start time
    const startTime = new Date();
    this.executionLocks.set(scheduleId, startTime);

    console.log(
      `\n=========== EXECUTING SCHEDULE ${scheduleId} (${executionId}) ===========`
    );
    console.log(`Execution started at: ${startTime.toISOString()}`);

    try {
      // Get fresh schedule data
      const scheduleData = await getScheduleById(scheduleId);

      if (!scheduleData) {
        console.error(`[ERROR] Schedule ${scheduleId} not found`);
        return;
      }

      console.log(`Schedule name: ${scheduleData.name}`);
      console.log(`Template ID: ${scheduleData.templateId}`);
      console.log(`Recipients:`, scheduleData.recipients);

      // Add execution tracking to history
      await addScheduleHistory(scheduleId, {
        success: 0,
        failed: 0,
        details: [
          { status: "execution_started", time: startTime.toISOString() },
        ],
      });

      // Get template data
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
      console.log(`Template content: ${template.content.substring(0, 100)}...`);
      console.log(`Parameters:`, scheduleData.paramValues);

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

      // NEW: Fetch active affiliates to get contact information
      console.log(`Fetching affiliate data from Google Sheets...`);
      const activeAffiliates = await getActiveAffiliates();

      // Create lookup map by phone number for quick access
      const affiliateMap = new Map();
      activeAffiliates.forEach((affiliate) => {
        if (affiliate.phone) {
          // Use the phoneKey function to normalize phone numbers for comparison
          const key = phoneKey(affiliate.phone);
          if (key) {
            affiliateMap.set(key, affiliate);
          }
        }
      });

      console.log(
        `Loaded ${affiliateMap.size} affiliates for contact info lookup`
      );

      console.log(`Starting message sending process...`);
      console.log(`Processing ${scheduleData.recipients.length} recipients...`);

      try {
        const processRecipient = async (recipient, index) => {
          try {
            console.log(`\nProcessing recipient #${index + 1}: ${recipient}`);

            // Format phone number if needed
            let formattedChatId;
            if (recipient.includes("@c.us")) {
              formattedChatId = recipient;
            } else {
              const phoneResult = validateAndFormatPhone(recipient);
              if (!phoneResult.isValid) {
                console.error(
                  `Invalid phone number ${recipient}: ${phoneResult.error}`
                );
                throw new Error(`Invalid phone number: ${phoneResult.error}`);
              }
              formattedChatId = phoneResult.formatted;
            }

            console.log(`Formatted chat ID: ${formattedChatId}`);

            // Extract phone number for lookup
            const contactPhone = formattedChatId.split("@")[0];
            const normalizedPhone = phoneKey(contactPhone);

            // Look up affiliate info by phone number
            const affiliateInfo = affiliateMap.get(normalizedPhone);

            // Create contact object with real name if found, or fallback
            const contactData = affiliateInfo
              ? {
                  name: affiliateInfo.name || "Affiliate",
                  phone: contactPhone,
                  platform: affiliateInfo.platform,
                }
              : {
                  name: "Affiliate",
                  phone: contactPhone,
                };

            console.log(`Contact data for ${contactPhone}:`, contactData);

            // Process the template with both dynamic and static parameters
            const processedMessage = processAllParameters(
              template.content,
              contactData,
              scheduleData.paramValues
            );

            console.log(
              `Message preview: ${processedMessage.substring(0, 50)}...`
            );

            const sessionName = scheduleData.sessionName;
            const imageUrl = scheduleData.imageUrl || template.imageUrl;

            let responseData;
            if (imageUrl) {
              console.log(
                `Sending message with image via WAHA session '${
                  sessionName || wahaClient.defaultSession
                }'`
              );
              responseData = await wahaClient.sendImageWithValidation(
                sessionName,
                formattedChatId,
                imageUrl,
                processedMessage,
                null,
                null,
                true
              );
            } else {
              console.log(
                `Sending text message via WAHA session '${
                  sessionName || wahaClient.defaultSession
                }'`
              );
              responseData = await wahaClient.sendTextWithValidation(
                sessionName,
                formattedChatId,
                processedMessage,
                true
              );
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
        };

        const sequentialResults = [];
        for (let i = 0; i < scheduleData.recipients.length; i += 1) {
          if (i > 0 && this.delayBetweenSendsMs > 0) {
            console.log(
              `Delaying ${this.delayBetweenSendsMs}ms before next recipient`
            );
            await sleep(this.delayBetweenSendsMs);
          }

          const result = await processRecipient(
            scheduleData.recipients[i],
            i
          );
          sequentialResults.push(result);
        }

        const results = sequentialResults;

        console.log(`All messages processed. Analyzing results...`);

        // Process results
        const successResults = results.filter((r) => r.success);
        const failedResults = results.filter((r) => !r.success);

        console.log(`Results summary:`);
        console.log(`- Total processed: ${results.length}`);
        console.log(`- Successful: ${successResults.length}`);
        console.log(`- Failed: ${failedResults.length}`);

        // Update history
        const historyEntry = {
          success: successResults.length,
          failed: failedResults.length,
          details: [
            ...successResults,
            ...failedResults,
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
          this.cancelJob(scheduleId);
        } else {
          // Update next run time for recurring schedules
          const job = this.jobs.get(scheduleId);
          if (job) {
            const nextDate = job.nextDate();
            if (nextDate) {
              console.log(
                `Next run time for ${scheduleId}: ${nextDate.toISO()}`
              );
              console.log(
                `Next run in local time: ${nextDate.toLocal().toString()}`
              );

              await updateSchedule(scheduleId, {
                lastRun: startTime.toISOString(),
                nextRun: nextDate.toJSDate().toISOString(),
              });
            } else {
              console.log(
                `[WARNING] Unable to calculate next run for ${scheduleId}`
              );

              await updateSchedule(scheduleId, {
                lastRun: startTime.toISOString(),
              });
            }
          }
        }

        console.log(`=========== EXECUTION COMPLETE ===========\n`);
      } catch (error) {
        console.error(`[ERROR] Error in sending process:`, error);
        console.error(`Error stack:`, error.stack);
        throw error; // Re-throw to be caught by outer try-catch
      }
    } catch (error) {
      console.error(`[ERROR] Error in execution:`, error);
      console.error(`Error type: ${error.constructor.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack:`, error.stack);

      // Update schedule status to reflect the error
      await updateSchedule(scheduleId, {
        status: "error",
        error: error.message || "Unknown error during execution",
      });
    } finally {
      // Release execution lock to allow future executions
      const endTime = new Date();
      const duration = endTime - startTime;
      console.log(`Execution completed at: ${endTime.toISOString()}`);
      console.log(`Execution duration: ${duration}ms`);
      console.log(
        `=========== EXECUTION COMPLETE ${scheduleId} (${executionId}) ===========\n`
      );
      this.executionLocks.delete(scheduleId);
    }
  }

  // Recreate job with updated data
  async updateJob(scheduleId) {
    const scheduleData = await getScheduleById(scheduleId);
    if (scheduleData) {
      await this.scheduleJob(scheduleData);
      return true;
    }
    return false;
  }

  // Check and execute any schedules that are due
  async checkAndExecuteSchedules() {
    console.log("Manually checking for schedules to execute...");

    try {
      // Get all active schedules
      const schedules = await getAllSchedules();
      const activeSchedules = schedules.filter((s) => s.status === "active");

      console.log(`Found ${activeSchedules.length} active schedules`);

      // Check each schedule to see if it should be executed
      const now = new Date();

      for (const schedule of activeSchedules) {
        // Skip if no nextRun is defined
        if (!schedule.nextRun) {
          console.log(
            `Schedule ${schedule.id} has no nextRun defined, skipping`
          );
          continue;
        }

        const nextRun = new Date(schedule.nextRun);

        // If nextRun is in the past or very close to now (within 1 minute), execute it
        if (nextRun <= new Date(now.getTime() + 60000)) {
          console.log(
            `Schedule ${
              schedule.id
            } is due for execution (nextRun: ${nextRun.toISOString()})`
          );
          await this.executeSchedule(schedule.id);
        } else {
          console.log(
            `Schedule ${
              schedule.id
            } is not due yet (nextRun: ${nextRun.toISOString()})`
          );
        }
      }

      console.log("Schedule check complete");
    } catch (error) {
      console.error("Error checking and executing schedules:", error);
    }
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
