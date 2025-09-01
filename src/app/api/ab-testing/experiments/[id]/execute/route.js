// src/app/api/ab-testing/experiments/[id]/execute/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { formatPhoneNumber } from "@/lib/utils";

/**
 * POST /api/ab-testing/experiments/[id]/execute
 * Execute an A/B testing experiment (start, pause, resume, or send next batch)
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const experimentId = parseInt(id);
    const body = await request.json();
    const { action } = body; // start, pause, resume, send_batch
    
    console.log(`[A/B Testing] Execute request for experiment ${experimentId}, action: ${action}`, body);

    if (!experimentId) {
      return NextResponse.json(
        { error: "Invalid experiment ID" },
        { status: 400 }
      );
    }
    
    if (!action) {
      return NextResponse.json(
        { error: "Action is required. Valid actions: start, pause, resume, send_batch, stop" },
        { status: 400 }
      );
    }

    const experiment = await prisma.aBExperiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: {
          include: {
            template: true
          }
        }
      }
    });

    if (!experiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "start":
        return await startExperiment(experiment);
      case "pause":
        return await pauseExperiment(experiment);
      case "resume":
        return await resumeExperiment(experiment);
      case "send_batch":
        return await sendNextBatch(experiment);
      case "stop":
        return await stopExperiment(experiment);
      default:
        return NextResponse.json(
          { error: `Invalid action '${action}'. Valid actions: start, pause, resume, send_batch, stop` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error executing A/B experiment:", error);
    return NextResponse.json(
      { error: "Failed to execute experiment action" },
      { status: 500 }
    );
  }
}

/**
 * Start an A/B testing experiment
 */
async function startExperiment(experiment) {
  console.log(`[A/B Testing] Starting experiment ${experiment.id}, status: ${experiment.status}, sessionName: ${experiment.sessionName}`);
  
  if (experiment.status !== "draft") {
    console.log(`[A/B Testing] Cannot start experiment ${experiment.id}: status is '${experiment.status}', expected 'draft'`);
    return NextResponse.json(
      { error: "Only draft experiments can be started" },
      { status: 400 }
    );
  }

  // Check if WhatsApp session is available
  console.log(`[A/B Testing] Checking WhatsApp session: ${experiment.sessionName}`);
  const sessionStatus = await checkWhatsAppSession(experiment.sessionName);
  console.log(`[A/B Testing] Session status:`, sessionStatus);
  
  if (!sessionStatus.connected) {
    console.log(`[A/B Testing] Cannot start experiment ${experiment.id}: WhatsApp session '${experiment.sessionName}' not connected`);
    return NextResponse.json(
      { error: `WhatsApp session '${experiment.sessionName}' is not connected` },
      { status: 400 }
    );
  }

  // Update experiment status to active
  const updatedExperiment = await prisma.aBExperiment.update({
    where: { id: experiment.id },
    data: {
      status: "active",
      startedAt: new Date(),
    }
  });

  // Initialize rate limiting for the session
  await initializeRateLimit(experiment.sessionName);

  return NextResponse.json({
    message: "Experiment started successfully",
    experiment: updatedExperiment,
    nextAction: "send_batch"
  });
}

/**
 * Pause an A/B testing experiment
 */
async function pauseExperiment(experiment) {
  if (experiment.status !== "active") {
    return NextResponse.json(
      { error: "Only active experiments can be paused" },
      { status: 400 }
    );
  }

  const updatedExperiment = await prisma.aBExperiment.update({
    where: { id: experiment.id },
    data: { status: "paused" }
  });

  return NextResponse.json({
    message: "Experiment paused successfully",
    experiment: updatedExperiment
  });
}

/**
 * Resume a paused A/B testing experiment
 */
async function resumeExperiment(experiment) {
  if (experiment.status !== "paused") {
    return NextResponse.json(
      { error: "Only paused experiments can be resumed" },
      { status: 400 }
    );
  }

  const updatedExperiment = await prisma.aBExperiment.update({
    where: { id: experiment.id },
    data: { status: "active" }
  });

  return NextResponse.json({
    message: "Experiment resumed successfully",
    experiment: updatedExperiment,
    nextAction: "send_batch"
  });
}

/**
 * Stop an A/B testing experiment
 */
async function stopExperiment(experiment) {
  if (!["active", "paused"].includes(experiment.status)) {
    return NextResponse.json(
      { error: "Only active or paused experiments can be stopped" },
      { status: 400 }
    );
  }

  const updatedExperiment = await prisma.aBExperiment.update({
    where: { id: experiment.id },
    data: {
      status: "completed",
      endedAt: new Date(),
    }
  });

  return NextResponse.json({
    message: "Experiment stopped successfully",
    experiment: updatedExperiment
  });
}

/**
 * Send the next batch of messages for the experiment
 */
async function sendNextBatch(experiment) {
  if (experiment.status !== "active") {
    return NextResponse.json(
      { error: "Experiment must be active to send batches" },
      { status: 400 }
    );
  }

  // Check rate limiting
  const rateLimitStatus = await checkRateLimit(experiment.sessionName);
  if (!rateLimitStatus.canSend) {
    return NextResponse.json({
      error: "Rate limit exceeded",
      cooldownUntil: rateLimitStatus.cooldownUntil,
      nextBatchAllowed: rateLimitStatus.nextBatchAllowed
    }, { status: 429 });
  }

  const results = [];
  let totalSent = 0;
  let totalFailed = 0;

  // Process each variant
  for (const variant of experiment.variants) {
    const batchResult = await sendVariantBatch(experiment, variant);
    results.push(batchResult);
    totalSent += batchResult.sent;
    totalFailed += batchResult.failed;
  }

  // Update rate limiting
  await updateRateLimit(experiment.sessionName, totalSent);

  // Check if experiment is complete
  const pendingRecipients = await prisma.aBRecipient.count({
    where: {
      experimentId: experiment.id,
      status: "assigned"
    }
  });

  let updatedStatus = experiment.status;
  let endedAt = null;
  
  if (pendingRecipients === 0) {
    updatedStatus = "completed";
    endedAt = new Date();
  }

  // Update experiment if completed
  if (updatedStatus !== experiment.status) {
    await prisma.aBExperiment.update({
      where: { id: experiment.id },
      data: {
        status: updatedStatus,
        endedAt
      }
    });
  }

  return NextResponse.json({
    message: `Batch sent successfully. Sent: ${totalSent}, Failed: ${totalFailed}`,
    results,
    experiment: {
      ...experiment,
      status: updatedStatus,
      endedAt
    },
    hasMoreBatches: pendingRecipients > 0,
    nextBatchAllowed: rateLimitStatus.nextBatchAllowed
  });
}

/**
 * Send a batch for a specific variant
 */
async function sendVariantBatch(experiment, variant) {
  // Get pending recipients for this variant
  const recipients = await prisma.aBRecipient.findMany({
    where: {
      experimentId: experiment.id,
      variantId: variant.id,
      status: "assigned"
    },
    take: experiment.batchSize
  });

  if (recipients.length === 0) {
    return {
      variantId: variant.id,
      variantName: variant.name,
      sent: 0,
      failed: 0,
      recipients: []
    };
  }

  // Create a new batch record
  const batch = await prisma.aBBatch.create({
    data: {
      experimentId: experiment.id,
      variantId: variant.id,
      batchNumber: await getNextBatchNumber(experiment.id, variant.id),
      recipientCount: recipients.length,
      status: "sending",
      nextBatchAllowedAt: new Date(Date.now() + experiment.cooldownMinutes * 60 * 1000)
    }
  });

  // Prepare message content and determine message type
  const messageContent = variant.customMessage || variant.template?.content || "";
  const imageUrl = variant.imageUrl || variant.template?.imageUrl || null;
  const messageType = imageUrl ? 'image' : 'text';
  const caption = imageUrl ? messageContent : null;
  
  if (!messageContent && !imageUrl) {
    throw new Error(`No message content or image found for variant ${variant.name}`);
  }

  let successCount = 0;
  let failedCount = 0;
  const batchResults = [];

  // Send messages to recipients with delay between each
  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    
    try {
      // Format phone number
      const formattedPhone = formatPhoneNumber(recipient.phoneNumber);
      
      // Send message via WhatsApp API (text or image)
      const sendResult = await sendWhatsAppMessage(
        experiment.sessionName,
        formattedPhone,
        messageContent,
        messageType,
        imageUrl,
        caption
      );

      if (sendResult.success) {
        successCount++;
        
        // Create success result record
        await prisma.aBResult.create({
          data: {
            experimentId: experiment.id,
            variantId: variant.id,
            recipientId: recipient.id,
            batchId: batch.id,
            sentAt: new Date(),
            status: "sent",
            whatsappMessageId: sendResult.messageId,
            responseData: sendResult.response
          }
        });

        // Update recipient status
        await prisma.aBRecipient.update({
          where: { id: recipient.id },
          data: { status: "sent" }
        });

        batchResults.push({
          recipient: recipient.phoneNumber,
          status: "sent",
          messageId: sendResult.messageId
        });
      } else {
        throw new Error(sendResult.error);
      }
    } catch (error) {
      failedCount++;
      
      // Create failure result record
      await prisma.aBResult.create({
        data: {
          experimentId: experiment.id,
          variantId: variant.id,
          recipientId: recipient.id,
          batchId: batch.id,
          status: "failed",
          errorMessage: error.message,
          responseData: { error: error.message }
        }
      });

      // Update recipient status
      await prisma.aBRecipient.update({
        where: { id: recipient.id },
        data: { status: "failed" }
      });

      batchResults.push({
        recipient: recipient.phoneNumber,
        status: "failed",
        error: error.message
      });
    }

    // Add delay between messages (except for the last one)
    if (i < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
    }
  }

  // Update batch with final counts
  await prisma.aBBatch.update({
    where: { id: batch.id },
    data: {
      successCount,
      failedCount,
      status: "completed"
    }
  });

  return {
    variantId: variant.id,
    variantName: variant.name,
    sent: successCount,
    failed: failedCount,
    recipients: batchResults
  };
}

/**
 * Check WhatsApp session status
 */
async function checkWhatsAppSession(sessionName) {
  try {
    const wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_API_URL;
    const apiKey = process.env.NEXT_PUBLIC_WAHA_API_KEY;
    
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    
    if (apiKey) {
      headers["X-Api-Key"] = apiKey;
    }
    
    const response = await fetch(`${wahaApiUrl}/api/sessions/${sessionName}`, {
      method: "GET",
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        connected: ["CONNECTED", "AUTHENTICATED", "WORKING"].includes(data.status),
        status: data.status
      };
    } else {
      return { connected: false, status: "ERROR" };
    }
  } catch (error) {
    console.error("Error checking WhatsApp session:", error);
    return { connected: false, status: "ERROR" };
  }
}

/**
 * Send WhatsApp message (text or image)
 */
async function sendWhatsAppMessage(sessionName, chatId, messageContent, messageType = 'text', imageUrl = null, caption = null) {
  try {
    const wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_API_URL;
    const apiKey = process.env.NEXT_PUBLIC_WAHA_API_KEY;
    
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    
    if (apiKey) {
      headers["X-Api-Key"] = apiKey;
    }
    
    let endpoint;
    let payload;
    
    if (messageType === 'image' && imageUrl) {
      // Send image message
      endpoint = `${wahaApiUrl}/api/sendImage`;
      payload = {
        session: sessionName,
        chatId: chatId,
        file: {
          mimetype: "image/jpeg",
          url: imageUrl,
          filename: "image.jpeg"
        },
        caption: caption || messageContent || ""
      };
    } else {
      // Send text message (default)
      endpoint = `${wahaApiUrl}/api/sendText`;
      payload = {
        session: sessionName,
        chatId: chatId,
        text: messageContent
      };
    }
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        messageId: data.id,
        response: data
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || errorData.error || "Failed to send message"
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Initialize rate limiting for a session
 */
async function initializeRateLimit(sessionName) {
  await prisma.aBRateLimit.upsert({
    where: { sessionName },
    update: {
      lastSendAt: new Date(),
      messagesSentHour: 0,
      messagesSentDay: 0,
      cooldownUntil: null
    },
    create: {
      sessionName,
      lastSendAt: new Date(),
      messagesSentHour: 0,
      messagesSentDay: 0
    }
  });
}

/**
 * Check rate limiting status
 */
async function checkRateLimit(sessionName) {
  const rateLimit = await prisma.aBRateLimit.findUnique({
    where: { sessionName }
  });

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Reset counters if needed
  let messagesSentHour = rateLimit?.messagesSentHour || 0;
  let messagesSentDay = rateLimit?.messagesSentDay || 0;

  if (rateLimit && rateLimit.lastSendAt < hourAgo) {
    messagesSentHour = 0;
  }
  if (rateLimit && rateLimit.lastSendAt < dayAgo) {
    messagesSentDay = 0;
  }

  // Check if still in cooldown
  if (rateLimit?.cooldownUntil && rateLimit.cooldownUntil > now) {
    return {
      canSend: false,
      cooldownUntil: rateLimit.cooldownUntil,
      nextBatchAllowed: rateLimit.cooldownUntil
    };
  }

  // Rate limits (configurable)
  const MAX_PER_HOUR = 100;
  const MAX_PER_DAY = 1000;

  const canSend = messagesSentHour < MAX_PER_HOUR && messagesSentDay < MAX_PER_DAY;
  
  let nextBatchAllowed = now;
  if (!canSend) {
    // If hour limit exceeded, wait until next hour
    if (messagesSentHour >= MAX_PER_HOUR) {
      nextBatchAllowed = new Date(rateLimit.lastSendAt.getTime() + 60 * 60 * 1000);
    }
    // If day limit exceeded, wait until next day
    if (messagesSentDay >= MAX_PER_DAY) {
      nextBatchAllowed = new Date(rateLimit.lastSendAt.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  return {
    canSend,
    messagesSentHour,
    messagesSentDay,
    nextBatchAllowed
  };
}

/**
 * Update rate limiting counters
 */
async function updateRateLimit(sessionName, messageCount) {
  const now = new Date();
  
  await prisma.aBRateLimit.upsert({
    where: { sessionName },
    update: {
      lastSendAt: now,
      messagesSentHour: { increment: messageCount },
      messagesSentDay: { increment: messageCount },
      cooldownUntil: new Date(now.getTime() + 5 * 60 * 1000) // 5 minute cooldown
    },
    create: {
      sessionName,
      lastSendAt: now,
      messagesSentHour: messageCount,
      messagesSentDay: messageCount,
      cooldownUntil: new Date(now.getTime() + 5 * 60 * 1000)
    }
  });
}

/**
 * Get next batch number for a variant
 */
async function getNextBatchNumber(experimentId, variantId) {
  const lastBatch = await prisma.aBBatch.findFirst({
    where: {
      experimentId,
      variantId
    },
    orderBy: { batchNumber: "desc" }
  });

  return (lastBatch?.batchNumber || 0) + 1;
}