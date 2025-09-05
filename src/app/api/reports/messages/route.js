// src/app/api/reports/messages/route.js
import messageHistory from "@/lib/services/messageHistory";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Reports][Messages]");

export async function POST(req) {
  try {
    const body = await req.json();
    
    const messageId = messageHistory.recordMessage(body.campaignId, {
      recipient: body.recipient,
      message: body.message,
      imageUrl: body.imageUrl,
      status: body.status,
      sentAt: body.sentAt ? new Date(body.sentAt) : new Date(),
      whatsappMessageId: body.whatsappMessageId,
      error: body.error,
      retryCount: body.retryCount,
      batchNumber: body.batchNumber,
      metadata: body.metadata
    });

    return Response.json({
      success: true,
      messageId: messageId
    });

  } catch (error) {
    logger.error("Failed to record message:", error);
    return Response.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}