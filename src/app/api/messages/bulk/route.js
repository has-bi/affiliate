// src/app/api/messages/bulk/route.js
import wahaClient from "@/lib/whatsapp/wahaClient";
import { logBroadcast } from "@/lib/sheets/spreadsheetService";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][BulkMessages]");
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

    // Format each recipient with @c.us
    const formattedRecipients = body.recipients.map((recipient) =>
      formatPhoneNumber(recipient)
    );

    // Get delay or use default
    const delay = body.delay || 3000;

    // Send bulk messages
    const result = await wahaClient.sendBulk(
      formattedRecipients,
      body.message,
      delay
    );

    // Log the broadcast to Google Sheets if enabled
    try {
      await logBroadcast({
        type: "manual",
        recipients: formattedRecipients,
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
