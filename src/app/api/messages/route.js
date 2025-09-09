// src/app/api/messages/route.js
import wahaClient from "@/lib/whatsapp/wahaClient";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Messages]");

export async function POST(req) {
  try {
    const body = await req.json();

    if (
      !body.recipients ||
      !Array.isArray(body.recipients) ||
      body.recipients.length === 0
    ) {
      return Response.json(
        { error: "Recipients array is required" },
        { status: 400 }
      );
    }

    if (!body.message) {
      return Response.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    // Only send to first recipient for single message endpoint
    const recipient = body.recipients[0];

    // Send message with session validation (for single messages)
    const result = await wahaClient.sendTextWithValidation(body.session || 'youvit', recipient, body.message);

    return Response.json({
      success: true,
      messageId: result?.id || null,
      recipient,
    });
  } catch (error) {
    logger.error("Error sending message:", error);
    return Response.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
