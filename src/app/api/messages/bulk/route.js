// src/app/api/messages/bulk/route.js
import wahaClient from "@/lib/whatsapp/wahaClient";
import { logBroadcast } from "@/lib/sheets/spreadsheetService";
import { createLogger } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils";
import { processAllParameters } from "@/lib/templates/templateUtils";
import { getTemplate } from "@/lib/templates/templateUtils";

const logger = createLogger("[API][BulkMessages]");

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Bulk message API called:", typeof body);

    // New approach: accept pre-processed messages
    if (body.processedMessages && Array.isArray(body.processedMessages)) {
      console.log(
        `Processing ${body.processedMessages.length} prepared messages`
      );

      // Get delay or use default
      const delay = body.delay || 3000;

      // Initialize results
      const results = {
        totalSent: 0,
        totalFailed: 0,
        success: [],
        failures: [],
      };

      // Process each message
      for (const item of body.processedMessages) {
        try {
          console.log(
            `Sending to ${item.recipient}:`,
            item.message.substring(0, 50) + "..."
          );

          // Send message via WAHA client
          const sendResult = await wahaClient.sendText(
            body.session,
            item.recipient,
            item.message
          );

          // Update results
          results.totalSent++;
          results.success.push({
            recipient: item.recipient,
            success: true,
            messageId: sendResult.id || "unknown",
          });

          console.log(`✅ Message sent to ${item.recipient}`);

          // Add delay between messages
          if (
            body.processedMessages.length > 1 &&
            results.totalSent < body.processedMessages.length
          ) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        } catch (error) {
          console.error(`❌ Failed to send to ${item.recipient}:`, error);
          results.totalFailed++;
          results.failures.push({
            recipient: item.recipient,
            success: false,
            error: error.message || "Failed to send message",
          });
        }
      }

      // Log the broadcast to Google Sheets
      try {
        await logBroadcast({
          type: "manual",
          recipients: body.processedMessages.map((m) => m.recipient),
          success: results.totalSent,
          failed: results.totalFailed,
          notes: `Template: ${body.templateName || "Manual send"}`,
        });
      } catch (logError) {
        console.error("Error logging broadcast:", logError);
      }

      return Response.json(results);
    }

    // Fallback to existing approach if no processed messages
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
  } catch (error) {
    console.error("Error sending bulk messages:", error);
    return Response.json(
      { error: error.message || "Failed to send bulk messages" },
      { status: 500 }
    );
  }
}
