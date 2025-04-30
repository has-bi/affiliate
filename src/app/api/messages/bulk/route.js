// src/app/api/messages/bulk/route.js
import baileysClient from "@/lib/whatsapp/baileysClient";
import { logBroadcast } from "@/lib/sheets/spreadsheetService";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][BulkMessages]");

export async function POST(req) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.session) {
      return Response.json(
        { error: "Session name is required" },
        { status: 400 }
      );
    }

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

    // Get delay or use default
    const delay = body.delay || 3000;

    // Send bulk messages
    const result = await baileysClient.sendBulk(
      body.session,
      body.recipients,
      body.message,
      delay
    );

    // Log the broadcast to Google Sheets
    try {
      await logBroadcast({
        type: "manual",
        recipients: body.recipients,
        success: result.totalSent,
        failed: result.totalFailed,
        notes: `Template: ${body.templateName || "Manual send"}`,
      });
    } catch (logError) {
      logger.error("Error logging broadcast:", logError);
      // Don't fail the request if logging fails
    }

    return Response.json(result);
  } catch (error) {
    logger.error("Error sending bulk messages:", error);
    return Response.json(
      { error: error.message || "Failed to send bulk messages" },
      { status: 500 }
    );
  }
}
