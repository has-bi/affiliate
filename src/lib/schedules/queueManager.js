import prisma from "@/lib/prisma";

class QueueManager {
  constructor() {
    this.wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_API_URL;
    this.isProcessing = false;
    this.processingIntervalId = null;
    this.rateLimits = {
      messagesPerMinute: 60,
      messagesPerHour: 1000,
      messagesPerDay: 10000
    };
    this.lastProcessedTime = new Map(); // Track per-session rate limiting
  }

  /**
   * Start the queue processor
   */
  start() {
    if (this.processingIntervalId) {
      console.log("Queue manager already running");
      return;
    }

    console.log("Starting queue manager...");
    
    // Process queue every 10 seconds
    this.processingIntervalId = setInterval(() => {
      this.processQueue().catch(error => {
        console.error("Error in queue processing:", error);
      });
    }, 10000);

    // Also process immediately
    this.processQueue().catch(error => {
      console.error("Error in initial queue processing:", error);
    });
  }

  /**
   * Stop the queue processor
   */
  stop() {
    if (this.processingIntervalId) {
      clearInterval(this.processingIntervalId);
      this.processingIntervalId = null;
      console.log("Queue manager stopped");
    }
  }

  /**
   * Process pending messages in the queue
   */
  async processQueue() {
    if (this.isProcessing) {
      console.log("Queue processing already in progress, skipping");
      return;
    }

    this.isProcessing = true;

    try {
      console.log("Processing message queue...");

      // Get pending messages that are due for processing
      const pendingMessages = await prisma.messageQueue.findMany({
        where: {
          status: 'pending',
          scheduledFor: { lte: new Date() },
          attempts: { lt: prisma.$queryRaw`max_attempts` }
        },
        include: {
          schedule: {
            select: {
              sessionName: true,
              status: true,
              dailyLimit: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' }, // High priority first
          { scheduledFor: 'asc' } // Older messages first
        },
        take: 50 // Process in batches
      });

      if (pendingMessages.length === 0) {
        console.log("No pending messages to process");
        return;
      }

      console.log(`Found ${pendingMessages.length} messages to process`);

      // Group messages by session for rate limiting
      const messagesBySession = pendingMessages.reduce((acc, msg) => {
        const sessionName = msg.schedule.sessionName;
        if (!acc[sessionName]) {
          acc[sessionName] = [];
        }
        acc[sessionName].push(msg);
        return acc;
      }, {});

      // Process messages for each session with rate limiting
      for (const [sessionName, messages] of Object.entries(messagesBySession)) {
        await this.processSessionMessages(sessionName, messages);
      }

    } catch (error) {
      console.error("Error in queue processing:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process messages for a specific session with rate limiting
   */
  async processSessionMessages(sessionName, messages) {
    console.log(`Processing ${messages.length} messages for session ${sessionName}`);

    // Check session rate limits
    const rateLimitCheck = await this.checkSessionRateLimit(sessionName);
    if (!rateLimitCheck.allowed) {
      console.log(`Rate limit exceeded for session ${sessionName}. Next available: ${rateLimitCheck.nextAvailableAt}`);
      
      // Reschedule messages
      await this.rescheduleLaterMessages(messages, rateLimitCheck.nextAvailableAt);
      return;
    }

    const allowedCount = Math.min(messages.length, rateLimitCheck.allowedCount);
    const messagesToProcess = messages.slice(0, allowedCount);
    const messagesToReschedule = messages.slice(allowedCount);

    // Reschedule excess messages
    if (messagesToReschedule.length > 0) {
      await this.rescheduleLaterMessages(messagesToReschedule, rateLimitCheck.nextSlot);
    }

    // Process allowed messages
    for (const message of messagesToProcess) {
      await this.processMessage(message);
      
      // Add delay between messages to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }

    // Update last processed time for this session
    this.lastProcessedTime.set(sessionName, new Date());
  }

  /**
   * Process a single message
   */
  async processMessage(message) {
    console.log(`Processing message ${message.id} to ${message.chatId}`);

    try {
      // Update status to processing
      await prisma.messageQueue.update({
        where: { id: message.id },
        data: {
          status: 'processing',
          attempts: message.attempts + 1,
          updatedAt: new Date()
        }
      });

      // Check if schedule is still active
      if (message.schedule.status !== 'active') {
        await prisma.messageQueue.update({
          where: { id: message.id },
          data: {
            status: 'failed',
            errorMessage: `Schedule status is ${message.schedule.status}`,
            updatedAt: new Date()
          }
        });
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
        // Success
        await prisma.messageQueue.update({
          where: { id: message.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            responseData,
            errorMessage: null
          }
        });

        console.log(`✅ Message ${message.id} sent successfully`);

      } else {
        // API error
        const errorMessage = responseData.error || responseData.message || 'API request failed';
        
        // Determine if this is a permanent or temporary failure
        const shouldRetry = this.shouldRetryError(errorMessage);
        const maxAttempts = message.maxAttempts;

        if (!shouldRetry || message.attempts >= maxAttempts) {
          // Permanent failure or max attempts reached
          await prisma.messageQueue.update({
            where: { id: message.id },
            data: {
              status: 'failed',
              errorMessage: `${errorMessage} (attempt ${message.attempts}/${maxAttempts})`,
              updatedAt: new Date()
            }
          });

          console.log(`❌ Message ${message.id} failed permanently: ${errorMessage}`);

        } else {
          // Temporary failure - schedule for retry
          const nextRetryTime = this.calculateRetryTime(message.attempts);
          
          await prisma.messageQueue.update({
            where: { id: message.id },
            data: {
              status: 'pending', // Back to pending for retry
              errorMessage,
              scheduledFor: nextRetryTime,
              updatedAt: new Date()
            }
          });

          console.log(`⏳ Message ${message.id} scheduled for retry at ${nextRetryTime.toISOString()}`);
        }
      }

    } catch (error) {
      console.error(`Error processing message ${message.id}:`, error);
      
      // Handle network/system errors
      const nextRetryTime = message.attempts < message.maxAttempts 
        ? this.calculateRetryTime(message.attempts)
        : null;

      await prisma.messageQueue.update({
        where: { id: message.id },
        data: {
          status: nextRetryTime ? 'pending' : 'failed',
          errorMessage: error.message,
          scheduledFor: nextRetryTime,
          updatedAt: new Date()
        }
      });
    }
  }

  /**
   * Check session rate limits
   */
  async checkSessionRateLimit(sessionName) {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count recent messages for this session
    const [lastMinuteCount, lastHourCount, lastDayCount] = await Promise.all([
      prisma.messageQueue.count({
        where: {
          schedule: { sessionName },
          status: 'sent',
          sentAt: { gte: oneMinuteAgo }
        }
      }),
      prisma.messageQueue.count({
        where: {
          schedule: { sessionName },
          status: 'sent',
          sentAt: { gte: oneHourAgo }
        }
      }),
      prisma.messageQueue.count({
        where: {
          schedule: { sessionName },
          status: 'sent',
          sentAt: { gte: oneDayAgo }
        }
      })
    ]);

    // Check limits
    const minuteLimit = this.rateLimits.messagesPerMinute;
    const hourLimit = this.rateLimits.messagesPerHour;
    const dayLimit = this.rateLimits.messagesPerDay;

    let allowed = true;
    let nextAvailableAt = now;
    let allowedCount = Infinity;

    if (lastMinuteCount >= minuteLimit) {
      allowed = false;
      nextAvailableAt = new Date(oneMinuteAgo.getTime() + 61 * 1000); // Wait 1 minute + 1 second
    } else if (lastHourCount >= hourLimit) {
      allowed = false;
      nextAvailableAt = new Date(oneHourAgo.getTime() + 60 * 60 * 1000 + 1000); // Wait 1 hour + 1 second
    } else if (lastDayCount >= dayLimit) {
      allowed = false;
      nextAvailableAt = new Date(oneDayAgo.getTime() + 24 * 60 * 60 * 1000 + 1000); // Wait 1 day + 1 second
    } else {
      // Calculate how many messages we can send
      allowedCount = Math.min(
        minuteLimit - lastMinuteCount,
        hourLimit - lastHourCount,
        dayLimit - lastDayCount
      );
    }

    // Calculate next available slot for excess messages
    const nextSlot = new Date(now.getTime() + 60 * 1000); // Next minute

    return {
      allowed,
      allowedCount: Math.max(0, allowedCount),
      nextAvailableAt,
      nextSlot,
      limits: {
        minute: { used: lastMinuteCount, limit: minuteLimit },
        hour: { used: lastHourCount, limit: hourLimit },
        day: { used: lastDayCount, limit: dayLimit }
      }
    };
  }

  /**
   * Reschedule messages for later processing
   */
  async rescheduleLaterMessages(messages, nextAvailableAt) {
    const messageIds = messages.map(m => m.id);
    
    await prisma.messageQueue.updateMany({
      where: { id: { in: messageIds } },
      data: {
        scheduledFor: nextAvailableAt,
        updatedAt: new Date()
      }
    });

    console.log(`Rescheduled ${messages.length} messages for ${nextAvailableAt.toISOString()}`);
  }

  /**
   * Calculate retry time with exponential backoff
   */
  calculateRetryTime(attemptNumber) {
    const baseDelay = 5 * 60 * 1000; // 5 minutes
    const maxDelay = 60 * 60 * 1000; // 1 hour
    
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.2 * delay;
    
    return new Date(Date.now() + delay + jitter);
  }

  /**
   * Determine if error should be retried
   */
  shouldRetryError(errorMessage) {
    if (!errorMessage) return true;

    const errorLower = errorMessage.toLowerCase();

    // Permanent errors - don't retry
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

    return !permanentErrors.some(error => errorLower.includes(error));
  }

  /**
   * Add message to queue
   */
  async addToQueue(messageData) {
    const {
      scheduleId,
      batchId,
      recipient,
      messageContent,
      chatId,
      priority = 'normal',
      scheduledFor = new Date(),
      maxAttempts = 3
    } = messageData;

    const message = await prisma.messageQueue.create({
      data: {
        scheduleId,
        batchId,
        recipient,
        messageContent,
        chatId,
        priority,
        scheduledFor,
        maxAttempts,
        status: 'pending'
      }
    });

    console.log(`Added message ${message.id} to queue for ${chatId}`);
    return message;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [statusCounts, priorityCounts, oldestPending, rateLimitInfo] = await Promise.all([
      // Status breakdown
      prisma.messageQueue.groupBy({
        by: ['status'],
        _count: { status: true },
        _avg: { attempts: true }
      }),

      // Priority breakdown
      prisma.messageQueue.groupBy({
        by: ['priority'],
        where: { status: { in: ['pending', 'processing'] } },
        _count: { priority: true }
      }),

      // Oldest pending message
      prisma.messageQueue.findFirst({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true, scheduledFor: true }
      }),

      // Rate limit status per session
      prisma.schedule.findMany({
        where: { status: 'active' },
        select: { sessionName: true },
        distinct: ['sessionName']
      })
    ]);

    const statusSummary = statusCounts.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count.status,
        avgAttempts: stat._avg.attempts || 0
      };
      return acc;
    }, {});

    const prioritySummary = priorityCounts.reduce((acc, stat) => {
      acc[stat.priority] = stat._count.priority;
      return acc;
    }, {});

    // Get rate limit info for each active session
    const sessionRateLimits = await Promise.all(
      rateLimitInfo.map(async (session) => {
        const rateLimit = await this.checkSessionRateLimit(session.sessionName);
        return {
          sessionName: session.sessionName,
          ...rateLimit
        };
      })
    );

    return {
      statusBreakdown: statusSummary,
      priorityBreakdown: prioritySummary,
      oldestPending: oldestPending?.createdAt,
      nextScheduledMessage: oldestPending?.scheduledFor,
      sessionRateLimits,
      isProcessing: this.isProcessing,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Clean up old processed messages
   */
  async cleanupProcessedMessages(daysOld = 7) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const deletedCount = await prisma.messageQueue.deleteMany({
      where: {
        status: { in: ['sent', 'failed'] },
        updatedAt: { lt: cutoffDate }
      }
    });

    console.log(`Cleaned up ${deletedCount.count} old processed messages`);
    return deletedCount.count;
  }

  /**
   * Bulk priority update
   */
  async updateMessagePriority(messageIds, newPriority) {
    const result = await prisma.messageQueue.updateMany({
      where: {
        id: { in: messageIds },
        status: { in: ['pending', 'failed'] }
      },
      data: {
        priority: newPriority,
        scheduledFor: new Date(), // Process immediately for high priority
        updatedAt: new Date()
      }
    });

    return result.count;
  }
}

// Create singleton instance
const queueManager = new QueueManager();

// Auto-start queue processing
queueManager.start();

// Cleanup old messages daily
setInterval(() => {
  queueManager.cleanupProcessedMessages().catch(error => {
    console.error("Error in cleanup:", error);
  });
}, 24 * 60 * 60 * 1000); // Once per day

export default queueManager;