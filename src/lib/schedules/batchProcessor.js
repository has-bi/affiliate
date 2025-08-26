import prisma from "@/lib/prisma";
import { formatPhoneNumber, phoneKey } from "@/lib/utils";
import { getActiveAffiliates } from "@/lib/sheets/spreadsheetService";
import { getTemplate, processAllParameters } from "@/lib/templates/templateUtils";

class BatchProcessor {
  constructor() {
    this.wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_API_URL;
    this.isProcessing = new Set(); // Track which schedules are being processed
  }

  /**
   * Process a schedule with batch logic
   */
  async processScheduleWithBatches(scheduleId) {
    // Prevent duplicate processing
    if (this.isProcessing.has(scheduleId)) {
      console.log(`Schedule ${scheduleId} is already being processed`);
      return;
    }

    this.isProcessing.add(scheduleId);

    try {
      console.log(`\n=== Starting batch processing for schedule ${scheduleId} ===`);
      
      // Get schedule data
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          parameters: true,
          recipients: true,
          batches: {
            orderBy: { batchNumber: 'desc' },
            take: 1
          }
        }
      });

      if (!schedule) {
        throw new Error(`Schedule ${scheduleId} not found`);
      }

      // Check if we've reached daily limit
      if (await this.checkDailyLimit(scheduleId, schedule.dailyLimit)) {
        console.log(`Schedule ${scheduleId} has reached daily limit`);
        return;
      }

      // Get next batch to process
      const nextBatchNumber = schedule.batches.length > 0 
        ? schedule.batches[0].batchNumber + 1 
        : 1;

      // Calculate recipients for this batch
      const allRecipients = schedule.recipients.map(r => r.recipient);
      const startIndex = (nextBatchNumber - 1) * schedule.batchSize;
      const batchRecipients = allRecipients.slice(startIndex, startIndex + schedule.batchSize);

      if (batchRecipients.length === 0) {
        console.log(`No more recipients to process for schedule ${scheduleId}`);
        await this.markScheduleComplete(scheduleId);
        return;
      }

      // Create batch record
      const batch = await prisma.scheduleBatch.create({
        data: {
          scheduleId,
          batchNumber: nextBatchNumber,
          recipientsCount: batchRecipients.length,
          status: 'processing',
          nextBatchAt: this.calculateNextBatchTime(schedule.batchDelay)
        }
      });

      console.log(`Created batch ${nextBatchNumber} with ${batchRecipients.length} recipients`);

      // Process the batch
      await this.processBatch(schedule, batch, batchRecipients);

      // Schedule next batch if there are more recipients
      const remainingRecipients = allRecipients.length - (nextBatchNumber * schedule.batchSize);
      if (remainingRecipients > 0) {
        console.log(`Scheduling next batch in ${schedule.batchDelay} seconds`);
        setTimeout(() => {
          this.processScheduleWithBatches(scheduleId);
        }, schedule.batchDelay * 1000);
      } else {
        console.log(`All batches completed for schedule ${scheduleId}`);
        await this.markScheduleComplete(scheduleId);
      }

    } catch (error) {
      console.error(`Error processing schedule ${scheduleId}:`, error);
      await this.markScheduleError(scheduleId, error.message);
    } finally {
      this.isProcessing.delete(scheduleId);
    }
  }

  /**
   * Process a single batch of messages
   */
  async processBatch(schedule, batch, recipients) {
    const startTime = new Date();
    console.log(`Processing batch ${batch.batchNumber} with ${recipients.length} recipients`);

    try {
      // Get template and affiliate data
      const template = await getTemplate(schedule.templateId);
      if (!template) {
        throw new Error(`Template ${schedule.templateId} not found`);
      }

      const activeAffiliates = await getActiveAffiliates();
      const affiliateMap = new Map();
      activeAffiliates.forEach((affiliate) => {
        if (affiliate.phone) {
          const key = phoneKey(affiliate.phone);
          if (key) affiliateMap.set(key, affiliate);
        }
      });

      // Get parameter values
      const paramValues = Object.fromEntries(
        schedule.parameters.map(p => [p.paramId, p.paramValue])
      );

      // Create message queue entries for this batch
      const queueEntries = [];
      const processingPromises = [];

      for (const recipient of recipients) {
        try {
          const formattedChatId = recipient.includes("@c.us")
            ? recipient
            : `${formatPhoneNumber(recipient)}@c.us`;

          const contactPhone = formattedChatId.split("@")[0];
          const normalizedPhone = phoneKey(contactPhone);
          const affiliateInfo = affiliateMap.get(normalizedPhone);

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

          const processedMessage = processAllParameters(
            template.content,
            contactData,
            paramValues
          );

          // Create queue entry
          const queueEntry = await prisma.messageQueue.create({
            data: {
              scheduleId: schedule.id,
              batchId: batch.id,
              recipient,
              messageContent: processedMessage,
              chatId: formattedChatId,
              scheduledFor: new Date(),
              status: 'pending'
            }
          });

          queueEntries.push(queueEntry);

          // Process message with rate limiting
          const processingPromise = this.processQueuedMessage(queueEntry, schedule.sessionName)
            .then(() => ({ success: true, recipient }))
            .catch(error => ({ success: false, recipient, error: error.message }));

          processingPromises.push(processingPromise);

        } catch (error) {
          console.error(`Error preparing message for ${recipient}:`, error);
          processingPromises.push(
            Promise.resolve({ success: false, recipient, error: error.message })
          );
        }

        // Add small delay between message preparations to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Wait for all messages to be processed
      const results = await Promise.allSettled(processingPromises);
      
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      
      const failedCount = results.length - successCount;

      // Update batch status
      await prisma.scheduleBatch.update({
        where: { id: batch.id },
        data: {
          successCount,
          failedCount,
          status: 'completed',
          completedAt: new Date()
        }
      });

      console.log(`Batch ${batch.batchNumber} completed: ${successCount} sent, ${failedCount} failed`);

      // Add to schedule history
      await prisma.scheduleHistory.create({
        data: {
          scheduleId: schedule.id,
          successCount,
          failedCount,
          details: {
            batchNumber: batch.batchNumber,
            duration: new Date() - startTime,
            results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message })
          }
        }
      });

    } catch (error) {
      console.error(`Error processing batch ${batch.batchNumber}:`, error);
      
      await prisma.scheduleBatch.update({
        where: { id: batch.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        }
      });
      
      throw error;
    }
  }

  /**
   * Process a single queued message with retry logic
   */
  async processQueuedMessage(queueEntry, sessionName) {
    const maxAttempts = queueEntry.maxAttempts;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await prisma.messageQueue.update({
          where: { id: queueEntry.id },
          data: { 
            attempts: attempt,
            status: 'processing'
          }
        });

        console.log(`Sending message to ${queueEntry.chatId} (attempt ${attempt}/${maxAttempts})`);

        const response = await fetch(`${this.wahaApiUrl}/api/sendText`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            chatId: queueEntry.chatId,
            text: queueEntry.messageContent,
            session: sessionName,
          }),
        });

        const responseData = await response.json();

        if (response.ok) {
          // Success
          await prisma.messageQueue.update({
            where: { id: queueEntry.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
              responseData
            }
          });

          console.log(`✅ Message sent successfully to ${queueEntry.chatId}`);
          return;

        } else {
          // API error
          throw new Error(responseData.error || responseData.message || 'API request failed');
        }

      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed for ${queueEntry.chatId}: ${error.message}`);

        if (attempt < maxAttempts) {
          // Wait before retry with exponential backoff
          const delay = this.calculateRetryDelay(attempt);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    await prisma.messageQueue.update({
      where: { id: queueEntry.id },
      data: {
        status: 'failed',
        errorMessage: lastError.message
      }
    });

    throw lastError;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Calculate when next batch should run
   */
  calculateNextBatchTime(delaySeconds) {
    return new Date(Date.now() + (delaySeconds * 1000));
  }

  /**
   * Check if schedule has reached daily limit
   */
  async checkDailyLimit(scheduleId, dailyLimit) {
    if (!dailyLimit) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysSent = await prisma.messageQueue.count({
      where: {
        scheduleId,
        status: 'sent',
        sentAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    return todaysSent >= dailyLimit;
  }

  /**
   * Mark schedule as complete
   */
  async markScheduleComplete(scheduleId) {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        status: 'completed',
        updatedAt: new Date()
      }
    });
  }

  /**
   * Mark schedule as error
   */
  async markScheduleError(scheduleId, errorMessage) {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        status: 'error',
        updatedAt: new Date()
      }
    });
  }

  /**
   * Get batch processing status for a schedule
   */
  async getBatchStatus(scheduleId) {
    const batches = await prisma.scheduleBatch.findMany({
      where: { scheduleId },
      orderBy: { batchNumber: 'asc' },
      include: {
        _count: {
          select: {
            messageQueue: {
              where: {
                OR: [
                  { status: 'sent' },
                  { status: 'failed' },
                  { status: 'pending' }
                ]
              }
            }
          }
        }
      }
    });

    const totalMessages = await prisma.messageQueue.count({
      where: { scheduleId }
    });

    const sentMessages = await prisma.messageQueue.count({
      where: { scheduleId, status: 'sent' }
    });

    const failedMessages = await prisma.messageQueue.count({
      where: { scheduleId, status: 'failed' }
    });

    const pendingMessages = await prisma.messageQueue.count({
      where: { scheduleId, status: 'pending' }
    });

    return {
      batches,
      summary: {
        totalMessages,
        sentMessages,
        failedMessages,
        pendingMessages,
        completionPercentage: totalMessages > 0 ? (sentMessages + failedMessages) / totalMessages * 100 : 0
      }
    };
  }
}

const batchProcessor = new BatchProcessor();
export default batchProcessor;