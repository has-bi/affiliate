import { CronJob } from "cron";
import prisma from "@/lib/prisma";
import batchProcessor from "./batchProcessor";
import queueManager from "./queueManager";
import retryService from "./retryService";
import { validateCronExpression } from "@/lib/config/cronHelper";

class EnhancedSchedulerService {
  constructor() {
    this.jobs = new Map();
    this.executionLocks = new Map();
    this.isInitialized = false;
    
    // Initialize components
    this.batchProcessor = batchProcessor;
    this.queueManager = queueManager;
    this.retryService = retryService;
  }

  /**
   * Initialize the enhanced scheduler
   */
  async init() {
    if (this.isInitialized) {
      console.log("Enhanced scheduler already initialized");
      return;
    }

    console.log("Initializing enhanced scheduler service...");

    try {
      // Clear existing jobs
      this.jobs.forEach((job) => job.stop());
      this.jobs.clear();
      this.executionLocks.clear();

      // Load all active schedules
      await this.loadAllJobs();

      // Start background services
      this.startBackgroundServices();

      this.isInitialized = true;
      console.log("Enhanced scheduler initialized successfully");

    } catch (error) {
      console.error("Error initializing enhanced scheduler:", error);
      throw error;
    }
  }

  /**
   * Start background services
   */
  startBackgroundServices() {
    // Queue manager should already be started, but ensure it's running
    if (!this.queueManager.processingIntervalId) {
      this.queueManager.start();
    }

    // Start periodic cleanup (every hour)
    setInterval(() => {
      this.performMaintenance().catch(error => {
        console.error("Error in maintenance:", error);
      });
    }, 60 * 60 * 1000);

    console.log("Background services started");
  }

  /**
   * Load all scheduled jobs from database
   */
  async loadAllJobs() {
    console.log("Loading schedules from database...");
    
    const schedules = await prisma.schedule.findMany({
      where: {
        status: { in: ["active", "pending"] }
      },
      include: {
        parameters: true,
        recipients: true
      }
    });

    console.log(`Found ${schedules.length} active/pending schedules`);

    for (const schedule of schedules) {
      await this.scheduleJob(this.transformScheduleData(schedule));
    }
  }

  /**
   * Transform database schedule to expected format
   */
  transformScheduleData(schedule) {
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
      batchSize: schedule.batchSize,
      batchDelay: schedule.batchDelay,
      dailyLimit: schedule.dailyLimit,
      retryConfig: schedule.retryConfig,
      paramValues: Object.fromEntries(
        schedule.parameters.map((p) => [p.paramId, p.paramValue])
      ),
      recipients: schedule.recipients.map((r) => r.recipient),
      status: schedule.status
    };
  }

  /**
   * Schedule a job with enhanced features
   */
  async scheduleJob(scheduleData) {
    // Cancel any existing job
    this.cancelJob(scheduleData.id);
    this.executionLocks.delete(scheduleData.id);

    try {
      let job;
      console.log(`Creating enhanced job for schedule ${scheduleData.id}`);

      if (scheduleData.scheduleType === "once") {
        // One-time schedule
        const date = new Date(scheduleData.scheduleConfig.date);

        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date: ${scheduleData.scheduleConfig.date}`);
        }

        if (date <= new Date()) {
          console.log(`Schedule ${scheduleData.id} date is in the past, skipping`);
          await prisma.schedule.update({
            where: { id: scheduleData.id },
            data: { status: "completed" }
          });
          return;
        }

        const executeOnce = () => {
          console.log(`Executing one-time schedule ${scheduleData.id}`);
          this.executeScheduleWithBatches(scheduleData.id);
          this.cancelJob(scheduleData.id);
        };

        job = new CronJob(date, executeOnce, null, true, "Asia/Jakarta");

      } else if (scheduleData.scheduleType === "recurring") {
        // Recurring schedule
        const cronExpression = scheduleData.scheduleConfig.cronExpression;

        if (!cronExpression || !validateCronExpression(cronExpression)) {
          throw new Error(`Invalid cron expression: ${cronExpression}`);
        }

        const executeRecurring = () => {
          console.log(`Executing recurring schedule ${scheduleData.id}`);
          this.executeScheduleWithBatches(scheduleData.id);
        };

        job = new CronJob(
          cronExpression,
          executeRecurring,
          null,
          true,
          "Asia/Jakarta"
        );
      }

      if (job) {
        this.jobs.set(scheduleData.id, job);

        // Update database with next run time
        const nextDate = job.nextDate();
        if (nextDate) {
          await prisma.schedule.update({
            where: { id: scheduleData.id },
            data: {
              status: "active",
              nextRun: nextDate.toJSDate()
            }
          });
        }

        console.log(`Schedule ${scheduleData.id} created with enhanced features`);
      }

    } catch (error) {
      console.error(`Error creating enhanced job ${scheduleData.id}:`, error);
      await prisma.schedule.update({
        where: { id: scheduleData.id },
        data: {
          status: "error",
          updatedAt: new Date()
        }
      });
    }
  }

  /**
   * Execute schedule using batch processing
   */
  async executeScheduleWithBatches(scheduleId) {
    if (this.executionLocks.get(scheduleId)) {
      console.log(`Schedule ${scheduleId} is already executing`);
      return;
    }

    this.executionLocks.set(scheduleId, new Date());

    try {
      console.log(`Starting enhanced execution for schedule ${scheduleId}`);

      // Use batch processor for reliable execution
      await this.batchProcessor.processScheduleWithBatches(scheduleId);

      // Update last run time
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          lastRun: new Date(),
          updatedAt: new Date()
        }
      });

    } catch (error) {
      console.error(`Error in enhanced execution of schedule ${scheduleId}:`, error);
      
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          status: "error",
          updatedAt: new Date()
        }
      });

    } finally {
      this.executionLocks.delete(scheduleId);
    }
  }

  /**
   * Cancel a scheduled job
   */
  cancelJob(scheduleId) {
    if (this.jobs.has(scheduleId)) {
      const job = this.jobs.get(scheduleId);
      job.stop();
      this.jobs.delete(scheduleId);
      console.log(`Enhanced schedule ${scheduleId} cancelled`);
      return true;
    }
    return false;
  }

  /**
   * Update an existing job
   */
  async updateJob(scheduleId) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        parameters: true,
        recipients: true
      }
    });

    if (schedule) {
      await this.scheduleJob(this.transformScheduleData(schedule));
      return true;
    }
    return false;
  }

  /**
   * Create a new schedule with enhanced features
   */
  async createEnhancedSchedule(scheduleData) {
    console.log("Creating enhanced schedule:", scheduleData.name);

    // Validate batch configuration
    const batchSize = Math.min(Math.max(scheduleData.batchSize || 50, 1), 200);
    const batchDelay = Math.max(scheduleData.batchDelay || 300, 60); // Minimum 1 minute
    
    // Create schedule in database
    const schedule = await prisma.$transaction(async (tx) => {
      const newSchedule = await tx.schedule.create({
        data: {
          name: scheduleData.name,
          templateId: scheduleData.templateId,
          scheduleType: scheduleData.scheduleType,
          scheduledDate: scheduleData.scheduleType === "once" && scheduleData.scheduleConfig?.date
            ? new Date(scheduleData.scheduleConfig.date)
            : null,
          cronExpression: scheduleData.scheduleType === "recurring"
            ? scheduleData.scheduleConfig.cronExpression
            : null,
          status: "pending",
          sessionName: scheduleData.sessionName,
          batchSize,
          batchDelay,
          dailyLimit: scheduleData.dailyLimit,
          retryConfig: scheduleData.retryConfig ? JSON.stringify(scheduleData.retryConfig) : null
        }
      });

      // Create parameters
      if (scheduleData.paramValues) {
        await Promise.all(
          Object.entries(scheduleData.paramValues).map(([paramId, paramValue]) =>
            tx.scheduleParameter.create({
              data: {
                scheduleId: newSchedule.id,
                paramId,
                paramValue: String(paramValue || "")
              }
            })
          )
        );
      }

      // Create recipients
      await Promise.all(
        scheduleData.recipients.map((recipient) =>
          tx.scheduleRecipient.create({
            data: {
              scheduleId: newSchedule.id,
              recipient
            }
          })
        )
      );

      return newSchedule;
    });

    // Schedule the job
    const fullScheduleData = this.transformScheduleData({
      ...schedule,
      parameters: Object.entries(scheduleData.paramValues || {}).map(([paramId, paramValue]) => ({
        paramId,
        paramValue
      })),
      recipients: scheduleData.recipients.map(recipient => ({ recipient }))
    });

    await this.scheduleJob(fullScheduleData);

    console.log(`Enhanced schedule ${schedule.id} created successfully`);
    return schedule;
  }

  /**
   * Get comprehensive schedule status
   */
  async getScheduleStatus(scheduleId) {
    const [schedule, batchStatus, queueStats] = await Promise.all([
      prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          batches: {
            orderBy: { batchNumber: 'asc' },
            include: {
              _count: {
                select: {
                  messageQueue: true
                }
              }
            }
          },
          _count: {
            select: {
              messageQueue: {
                where: {
                  status: { in: ['sent', 'failed', 'pending', 'processing'] }
                }
              }
            }
          }
        }
      }),
      this.batchProcessor.getBatchStatus(scheduleId),
      this.queueManager.getQueueStats()
    ]);

    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    return {
      schedule: {
        id: schedule.id,
        name: schedule.name,
        status: schedule.status,
        scheduleType: schedule.scheduleType,
        nextRun: schedule.nextRun,
        lastRun: schedule.lastRun,
        batchSize: schedule.batchSize,
        batchDelay: schedule.batchDelay,
        dailyLimit: schedule.dailyLimit
      },
      batchStatus,
      queueInfo: {
        isActive: this.jobs.has(scheduleId),
        isExecuting: this.executionLocks.has(scheduleId)
      },
      systemStats: queueStats
    };
  }

  /**
   * Perform system maintenance
   */
  async performMaintenance() {
    console.log("Performing enhanced scheduler maintenance...");

    try {
      // Clean up old processed messages
      await this.queueManager.cleanupProcessedMessages(7);

      // Clean up old batch records
      const oldBatches = await prisma.scheduleBatch.deleteMany({
        where: {
          status: 'completed',
          completedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
          }
        }
      });

      console.log(`Maintenance completed. Cleaned ${oldBatches.count} old batches`);

      // Update schedule statistics
      await this.updateScheduleStats();

    } catch (error) {
      console.error("Error in maintenance:", error);
    }
  }

  /**
   * Update schedule statistics
   */
  async updateScheduleStats() {
    const activeSchedules = await prisma.schedule.findMany({
      where: {
        status: { in: ['active', 'pending'] }
      }
    });

    for (const schedule of activeSchedules) {
      try {
        const stats = await this.batchProcessor.getBatchStatus(schedule.id);
        
        // You could store these stats in the database if needed
        console.log(`Schedule ${schedule.id} stats:`, stats.summary);
        
      } catch (error) {
        console.error(`Error updating stats for schedule ${schedule.id}:`, error);
      }
    }
  }

  /**
   * Get system overview
   */
  async getSystemOverview() {
    const [scheduleStats, queueStats, retryStats] = await Promise.all([
      // Schedule statistics
      prisma.schedule.groupBy({
        by: ['status'],
        _count: { status: true }
      }),

      // Queue statistics  
      this.queueManager.getQueueStats(),

      // Retry statistics
      this.retryService.getRetryStats()
    ]);

    return {
      schedules: scheduleStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {}),
      queue: queueStats,
      retries: retryStats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const enhancedScheduler = new EnhancedSchedulerService();

// Initialize on module load
enhancedScheduler.init().catch(error => {
  console.error("Failed to initialize enhanced scheduler:", error);
});

export default enhancedScheduler;