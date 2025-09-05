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
    this.batchSize = 25; // Process 25 contacts per batch
    this.batchDelay = 2000; // 2 seconds between batches
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
      delay: options.delay || 8000,
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
    for (let i = 0; i < batch.length; i++) {
      const recipient = batch[i];

      try {
        let sendResult;

        // Send message (with or without image)
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

        // Add delay between messages (except for the last one in batch)
        if (i < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, job.delay));
        }

      } catch (error) {
        logger.error(`❌ Failed to send to ${recipient}:`, error);
        
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
  }
}

// Create singleton instance
const jobQueue = new JobQueue();

// Clean up old jobs every hour
setInterval(() => {
  jobQueue.cleanup();
}, 60 * 60 * 1000);

export default jobQueue;