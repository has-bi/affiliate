import prisma from "@/lib/prisma";

class RetryService {
  constructor() {
    this.wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_API_URL;
    this.retryIntervals = [
      5 * 60 * 1000,    // 5 minutes
      15 * 60 * 1000,   // 15 minutes  
      30 * 60 * 1000,   // 30 minutes
      60 * 60 * 1000,   // 1 hour
      120 * 60 * 1000,  // 2 hours
      240 * 60 * 1000,  // 4 hours
    ];
  }

  /**
   * Process failed messages for retry
   */
  async processRetries() {
    console.log("Processing failed messages for retry...");

    try {
      // Get failed messages that are eligible for retry
      const failedMessages = await prisma.messageQueue.findMany({
        where: {
          status: 'failed',
          attempts: {
            lt: 10 // Use reasonable max attempt limit
          },
          scheduledFor: {
            lte: new Date() // Only process messages that were scheduled to be sent
          }
        },
        include: {
          schedule: true,
          batch: true
        },
        orderBy: [
          { priority: 'desc' }, // High priority first
          { createdAt: 'asc' }   // Older messages first
        ],
        take: 100 // Process in batches
      });

      console.log(`Found ${failedMessages.length} messages eligible for retry`);

      for (const message of failedMessages) {
        await this.retryMessage(message);
        
        // Small delay between retries to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 200));
      }

    } catch (error) {
      console.error("Error processing retries:", error);
    }
  }

  /**
   * Retry a single message
   */
  async retryMessage(message) {
    const nextAttempt = message.attempts + 1;
    const maxAttempts = message.maxAttempts;

    console.log(`Retrying message ${message.id} (attempt ${nextAttempt}/${maxAttempts})`);

    try {
      // Update status to processing
      await prisma.messageQueue.update({
        where: { id: message.id },
        data: {
          status: 'processing',
          attempts: nextAttempt,
          updatedAt: new Date()
        }
      });

      // Determine if this error type should be retried
      if (!this.shouldRetryError(message.errorMessage)) {
        console.log(`Message ${message.id} has permanent error, skipping retry`);
        await this.markAsPermanentFailure(message.id);
        return;
      }

      // Send the message
      const response = await fetch(`${this.wahaApiUrl}/api/sendText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          chatId: message.chatId,
          text: message.messageContent,
          session: message.schedule.sessionName,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Success!
        await prisma.messageQueue.update({
          where: { id: message.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            responseData,
            errorMessage: null
          }
        });

        console.log(`✅ Message ${message.id} sent successfully on retry`);

        // Update batch success count
        if (message.batchId) {
          await this.updateBatchCounts(message.batchId);
        }

      } else {
        // Still failing
        const errorMessage = responseData.error || responseData.message || 'Retry failed';
        
        if (nextAttempt >= maxAttempts) {
          // Max attempts reached
          await prisma.messageQueue.update({
            where: { id: message.id },
            data: {
              status: 'failed',
              errorMessage: `Max retries exceeded: ${errorMessage}`,
              updatedAt: new Date()
            }
          });

          console.log(`❌ Message ${message.id} failed permanently after ${maxAttempts} attempts`);

        } else {
          // Schedule next retry
          const nextRetryTime = this.calculateNextRetryTime(nextAttempt);
          
          await prisma.messageQueue.update({
            where: { id: message.id },
            data: {
              status: 'failed',
              errorMessage,
              scheduledFor: nextRetryTime,
              updatedAt: new Date()
            }
          });

          console.log(`⏳ Message ${message.id} scheduled for next retry at ${nextRetryTime.toISOString()}`);
        }
      }

    } catch (error) {
      console.error(`Error retrying message ${message.id}:`, error);
      
      const nextRetryTime = nextAttempt < maxAttempts 
        ? this.calculateNextRetryTime(nextAttempt)
        : null;

      await prisma.messageQueue.update({
        where: { id: message.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          scheduledFor: nextRetryTime,
          updatedAt: new Date()
        }
      });
    }
  }

  /**
   * Calculate when to retry next based on attempt number
   */
  calculateNextRetryTime(attemptNumber) {
    const baseDelay = this.retryIntervals[Math.min(attemptNumber - 1, this.retryIntervals.length - 1)];
    
    // Add jitter (±20%) to prevent thundering herd
    const jitterFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
    const actualDelay = Math.floor(baseDelay * jitterFactor);
    
    return new Date(Date.now() + actualDelay);
  }

  /**
   * Determine if an error should be retried
   */
  shouldRetryError(errorMessage) {
    if (!errorMessage) return true;

    const errorLower = errorMessage.toLowerCase();

    // Permanent failures - don't retry
    const permanentErrors = [
      'invalid phone number',
      'blocked',
      'not a whatsapp number',
      'invalid session',
      'authentication failed',
      'unauthorized',
      'forbidden',
      'bad request',
      'invalid chat id'
    ];

    // Temporary failures - should retry
    const temporaryErrors = [
      'network error',
      'timeout',
      'rate limit',
      'server error',
      'service unavailable',
      'too many requests',
      'connection refused'
    ];

    // Check for permanent errors first
    if (permanentErrors.some(error => errorLower.includes(error))) {
      return false;
    }

    // Check for temporary errors
    if (temporaryErrors.some(error => errorLower.includes(error))) {
      return true;
    }

    // Default: retry unknown errors
    return true;
  }

  /**
   * Mark message as permanent failure
   */
  async markAsPermanentFailure(messageId) {
    await prisma.messageQueue.update({
      where: { id: messageId },
      data: {
        status: 'failed',
        attempts: 999, // Set to high number to prevent future retries
        errorMessage: 'Permanent failure - will not retry',
        updatedAt: new Date()
      }
    });
  }

  /**
   * Update batch success/failure counts
   */
  async updateBatchCounts(batchId) {
    const counts = await prisma.messageQueue.groupBy({
      by: ['status'],
      where: { batchId },
      _count: { status: true }
    });

    let successCount = 0;
    let failedCount = 0;

    counts.forEach(count => {
      if (count.status === 'sent') {
        successCount = count._count.status;
      } else if (count.status === 'failed') {
        failedCount = count._count.status;
      }
    });

    await prisma.scheduleBatch.update({
      where: { id: batchId },
      data: {
        successCount,
        failedCount
      }
    });
  }

  /**
   * Get retry statistics for monitoring
   */
  async getRetryStats() {
    const stats = await prisma.messageQueue.groupBy({
      by: ['status'],
      _count: { status: true },
      _avg: { attempts: true },
      _max: { attempts: true }
    });

    const failedWithRetries = await prisma.messageQueue.count({
      where: {
        status: 'failed',
        attempts: { gt: 1 }
      }
    });

    const pendingRetries = await prisma.messageQueue.count({
      where: {
        status: 'failed',
        attempts: { lt: 10 },
        scheduledFor: { gt: new Date() }
      }
    });

    return {
      statusCounts: stats.reduce((acc, stat) => {
        acc[stat.status] = {
          count: stat._count.status,
          avgAttempts: stat._avg.attempts,
          maxAttempts: stat._max.attempts
        };
        return acc;
      }, {}),
      failedWithRetries,
      pendingRetries,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Bulk retry failed messages for a specific schedule
   */
  async retrySchedule(scheduleId, options = {}) {
    const {
      resetAttempts = false,
      onlyRecentFailures = true,
      maxMessages = 1000
    } = options;

    console.log(`Retrying failed messages for schedule ${scheduleId}`);

    const whereClause = {
      scheduleId,
      status: 'failed',
      attempts: { lt: 10 }
    };

    // Only retry recent failures (last 24 hours) by default
    if (onlyRecentFailures) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      whereClause.updatedAt = { gte: yesterday };
    }

    const failedMessages = await prisma.messageQueue.findMany({
      where: whereClause,
      take: maxMessages,
      orderBy: { updatedAt: 'desc' }
    });

    console.log(`Found ${failedMessages.length} failed messages to retry`);

    for (const message of failedMessages) {
      if (resetAttempts) {
        await prisma.messageQueue.update({
          where: { id: message.id },
          data: {
            attempts: 0,
            scheduledFor: new Date(),
            status: 'pending'
          }
        });
      } else {
        await this.retryMessage(message);
      }

      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      processedCount: failedMessages.length,
      resetAttempts
    };
  }

  /**
   * Clean up old failed messages
   */
  async cleanupOldFailures(daysOld = 30) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const deletedCount = await prisma.messageQueue.deleteMany({
      where: {
        status: 'failed',
        attempts: { gte: 10 },
        updatedAt: { lt: cutoffDate }
      }
    });

    console.log(`Cleaned up ${deletedCount.count} old failed messages`);
    return deletedCount.count;
  }
}

const retryService = new RetryService();

// Auto-process retries every 5 minutes
setInterval(() => {
  retryService.processRetries().catch(error => {
    console.error("Error in automatic retry processing:", error);
  });
}, 5 * 60 * 1000);

export default retryService;