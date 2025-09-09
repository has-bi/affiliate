// src/lib/services/jobQueue.js
import { createLogger } from "@/lib/utils";
import wahaClient from "@/lib/whatsapp/wahaClient";
import { logBroadcast } from "@/lib/sheets/spreadsheetService";
import messageHistory from "./messageHistory.js";

const logger = createLogger("[JobQueue]");

// In-memory job storage (in production, use Redis or database)
class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.isProcessing = false;
    this.batchSize = 50; // Process 50 contacts per batch (increased from 25)
    this.batchDelay = 1000; // 1 second between batches (reduced from 2 seconds)
    this.adaptiveDelayEnabled = true; // Enable adaptive delays based on success rate
    this.recentFailures = []; // Track recent failures for rate limiting
  }

  /**
   * Create a new bulk message job
   * @param {Array} recipients - Array of recipients
   * @param {string} message - Message content
   * @param {Object} options - Job options
   * @returns {string} Job ID
   */
  createJob(recipients, message, options = {}) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      status: 'pending',
      recipients: recipients,
      message: message,
      session: options.session || 'youvit',
      delay: options.delay || 1500, // Reduced from 8000ms to 1.5 seconds
      imageUrl: options.imageUrl || null,
      templateName: options.templateName || 'Manual broadcast',
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      progress: {
        total: recipients.length,
        processed: 0,
        successful: 0,
        failed: 0,
        currentBatch: 0,
        totalBatches: Math.ceil(recipients.length / this.batchSize)
      },
      results: {
        success: [],
        failures: []
      },
      error: null
    };

    // Create campaign record in message history
    const campaignId = messageHistory.createCampaign({
      name: options.templateName || 'Bulk Job Campaign',
      type: 'bulk-job',
      session: job.session,
      message: job.message,
      imageUrl: job.imageUrl,
      templateId: options.templateId || null,
      templateName: job.templateName,
      jobId: jobId,
      totalRecipients: recipients.length,
      metadata: { jobOptions: options }
    });

    job.campaignId = campaignId;

    this.jobs.set(jobId, job);
    logger.info(`Created job ${jobId} with ${recipients.length} recipients`);

    // Start processing if not already running
    this.processQueue();

    return jobId;
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {Object|null} Job status
   */
  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all jobs
   * @returns {Array} All jobs
   */
  getAllJobs() {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Process the job queue
   */
  async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (true) {
        // Find next pending job
        const pendingJob = Array.from(this.jobs.values())
          .find(job => job.status === 'pending');

        if (!pendingJob) {
          break;
        }

        await this.processJob(pendingJob);
      }
    } catch (error) {
      logger.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single job
   * @param {Object} job - Job to process
   */
  async processJob(job) {
    logger.info(`Starting job ${job.id}`);
    
    job.status = 'running';
    job.startedAt = new Date();

    // Update campaign status
    messageHistory.updateCampaign(job.campaignId, {
      status: 'running',
      startedAt: job.startedAt
    });

    try {
      // First, validate the WhatsApp session before processing any messages
      logger.info(`Checking WhatsApp session '${job.session}' before processing job ${job.id}`);
      const sessionCheck = await wahaClient.checkSession();
      
      if (!sessionCheck.isConnected) {
        throw new Error(`WhatsApp session '${job.session}' is not connected (${sessionCheck.status}). Please check your WAHA server and WhatsApp connection.`);
      }
      
      logger.info(`Session '${job.session}' is connected (${sessionCheck.status}), proceeding with job ${job.id}`);
      
      // Split recipients into batches
      const batches = this.createBatches(job.recipients);
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        job.progress.currentBatch = batchIndex + 1;
        
        logger.info(`Processing batch ${batchIndex + 1}/${batches.length} for job ${job.id}`);

        // Process batch
        await this.processBatch(job, batch);

        // Add delay between batches (except for the last one)
        if (batchIndex < batches.length - 1) {
          logger.info(`Waiting ${this.batchDelay}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, this.batchDelay));
        }
      }

      // Log to spreadsheet
      try {
        await logBroadcast({
          type: "bulk_job",
          recipients: job.recipients,
          success: job.progress.successful,
          failed: job.progress.failed,
          total: job.progress.total
        });
      } catch (logError) {
        logger.warn(`Failed to log job ${job.id} to spreadsheet:`, logError);
      }

      job.status = 'completed';
      job.completedAt = new Date();
      
      // Update campaign status
      messageHistory.updateCampaign(job.campaignId, {
        status: 'completed',
        completedAt: job.completedAt,
        successfulSends: job.progress.successful,
        failedSends: job.progress.failed,
        processedRecipients: job.progress.processed
      });
      
      logger.info(`Completed job ${job.id}: ${job.progress.successful}/${job.progress.total} sent successfully`);

    } catch (error) {
      logger.error(`Job ${job.id} failed:`, error);
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
    }
  }

  /**
   * Process a batch of recipients
   * @param {Object} job - Job object
   * @param {Array} batch - Batch of recipients
   */
  async processBatch(job, batch) {
    // Track consecutive failures to implement smart retries
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 5;
    
    for (let i = 0; i < batch.length; i++) {
      const recipient = batch[i];

      try {
        let sendResult;

        // Send message (with or without image) - skip individual session checks
        // since we already validated the session at job start
        if (job.imageUrl) {
          sendResult = await wahaClient.sendImage(
            job.session,
            recipient,
            job.imageUrl,
            job.message
          );
        } else {
          sendResult = await wahaClient.sendText(
            job.session,
            recipient,
            job.message
          );
        }

        // Record success
        job.progress.successful++;
        job.progress.processed++;
        job.results.success.push({
          recipient,
          success: true,
          messageId: sendResult.id || "unknown",
          batchNumber: job.progress.currentBatch
        });

        // Record message in history
        messageHistory.recordMessage(job.campaignId, {
          recipient: recipient,
          message: job.message,
          imageUrl: job.imageUrl,
          status: 'success',
          sentAt: new Date(),
          whatsappMessageId: sendResult.id || null,
          batchNumber: job.progress.currentBatch
        });

        logger.info(`✅ Sent to ${recipient} (${job.progress.processed}/${job.progress.total})`);
        consecutiveFailures = 0; // Reset failure counter on success

        // Add intelligent delay between messages (except for the last one in batch)
        if (i < batch.length - 1) {
          const adaptiveDelay = this.calculateAdaptiveDelay(job, job.progress);
          await new Promise(resolve => setTimeout(resolve, adaptiveDelay));
        }

      } catch (error) {
        logger.error(`❌ Failed to send to ${recipient}:`, error);
        
        consecutiveFailures++;
        job.progress.failed++;
        job.progress.processed++;
        job.results.failures.push({
          recipient,
          success: false,
          error: error.message || "Failed to send message",
          batchNumber: job.progress.currentBatch
        });

        // Record failure in history
        messageHistory.recordMessage(job.campaignId, {
          recipient: recipient,
          message: job.message,
          imageUrl: job.imageUrl,
          status: 'failed',
          sentAt: new Date(),
          error: error.message || "Failed to send message",
          batchNumber: job.progress.currentBatch
        });

        // Track failure for adaptive rate limiting
        this.trackFailure(error);
        
        // If too many consecutive failures, pause and check session
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          logger.warn(`Too many consecutive failures (${consecutiveFailures}), checking session and adding pause`);
          
          // Check session status (force refresh)
          const sessionRecheck = await wahaClient.checkSession(true);
          if (!sessionRecheck.isConnected) {
            logger.error(`Session lost during job processing: ${sessionRecheck.status}`);
            throw new Error(`Session disconnected: ${sessionRecheck.status}`);
          }
          
          // Add longer pause after consecutive failures
          logger.info(`Adding 10 second pause after consecutive failures`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          consecutiveFailures = 0; // Reset counter
        }
      }
    }
  }

  /**
   * Create batches from recipients array
   * @param {Array} recipients - Recipients to batch
   * @returns {Array} Array of batches
   */
  createBatches(recipients) {
    const batches = [];
    for (let i = 0; i < recipients.length; i += this.batchSize) {
      batches.push(recipients.slice(i, i + this.batchSize));
    }
    return batches;
  }

  /**
   * Cancel a job
   * @param {string} jobId - Job ID to cancel
   * @returns {boolean} Success status
   */
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === 'pending') {
      job.status = 'cancelled';
      job.completedAt = new Date();
      logger.info(`Cancelled job ${jobId}`);
      return true;
    }

    // Can't cancel running jobs for now
    return false;
  }

  /**
   * Calculate adaptive delay based on success rate and batch size
   * @param {Object} job - Current job
   * @param {Object} progress - Job progress
   * @returns {number} Adaptive delay in milliseconds
   */
  calculateAdaptiveDelay(job, progress) {
    if (!this.adaptiveDelayEnabled) {
      return job.delay;
    }

    const baseDelay = job.delay;
    const successRate = progress.processed > 0 ? progress.successful / progress.processed : 1;
    const totalRecipients = progress.total;
    const recentFailureCount = this.getRecentFailureCount();

    // Start with base delay
    let adaptiveDelay = baseDelay;

    // Reduce delay for smaller batches (under 20 recipients)
    if (totalRecipients <= 20) {
      adaptiveDelay = Math.min(adaptiveDelay, 1000); // Max 1 second for small batches
    }

    // Reduce delay if success rate is high
    if (successRate >= 0.95 && recentFailureCount === 0) {
      adaptiveDelay = Math.max(adaptiveDelay * 0.6, 800); // Reduce by 40%, min 0.8 seconds
    } else if (successRate >= 0.85) {
      adaptiveDelay = Math.max(adaptiveDelay * 0.8, 1000); // Reduce by 20%, min 1 second
    }

    // Increase delay if there are recent failures (rate limiting)
    if (recentFailureCount >= 3) {
      adaptiveDelay = Math.min(adaptiveDelay * 2, 10000); // Double delay, max 10 seconds
    } else if (recentFailureCount >= 1) {
      adaptiveDelay = Math.min(adaptiveDelay * 1.5, 5000); // Increase by 50%, max 5 seconds
    }

    return Math.round(adaptiveDelay);
  }

  /**
   * Track a failure for adaptive rate limiting
   * @param {Error} error - The error that occurred
   */
  trackFailure(error) {
    const now = Date.now();
    const failure = {
      timestamp: now,
      error: error.message || 'Unknown error'
    };
    
    this.recentFailures.push(failure);
    
    // Keep only failures from the last 5 minutes
    this.recentFailures = this.recentFailures.filter(
      f => now - f.timestamp < 5 * 60 * 1000
    );
  }

  /**
   * Get count of recent failures (last 5 minutes)
   * @returns {number} Number of recent failures
   */
  getRecentFailureCount() {
    const now = Date.now();
    return this.recentFailures.filter(
      f => now - f.timestamp < 5 * 60 * 1000
    ).length;
  }

  /**
   * Clean up old jobs (keep last 100)
   */
  cleanup() {
    const jobs = Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt - a.createdAt);

    if (jobs.length > 100) {
      const toRemove = jobs.slice(100);
      toRemove.forEach(job => {
        if (job.status !== 'running') {
          this.jobs.delete(job.id);
        }
      });
      logger.info(`Cleaned up ${toRemove.length} old jobs`);
    }
    
    // Also clean up old failures
    const now = Date.now();
    this.recentFailures = this.recentFailures.filter(
      f => now - f.timestamp < 5 * 60 * 1000
    );
  }
}

// Create singleton instance
const jobQueue = new JobQueue();

// Clean up old jobs every hour
setInterval(() => {
  jobQueue.cleanup();
}, 60 * 60 * 1000);

export default jobQueue;