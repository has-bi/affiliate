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
    
    // New approach: accept pre-processed messages
    if (body.processedMessages && Array.isArray(body.processedMessages)) {
      
      // Check session once at the start of bulk operation
      const sessionStatus = await wahaClient.checkSession();
      if (!sessionStatus.isConnected) {
        return Response.json(
          { error: `WhatsApp session '${body.session || 'youvit'}' is not connected (${sessionStatus.status})` },
          { status: 400 }
        );
      }
      
      // Get delay or use optimized default (1 second instead of 2)
      const delay = body.delay || 1000;

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

          let sendResult;

          // Send image first if provided
          if (body.image && body.image.url) {
            sendResult = await wahaClient.sendImage(
              body.session,
              item.recipient,
              body.image.url,
              item.message, // Use message as caption
              body.image.mimetype || body.image.type, // MIME type from uploaded image
              body.image.filename // Filename from uploaded image
            );
          } else {
            // Send text message only
            sendResult = await wahaClient.sendText(
              body.session,
              item.recipient,
              item.message
            );
          }

          // Update results
          results.totalSent++;
          results.success.push({
            recipient: item.recipient,
            success: true,
            messageId: sendResult.id || "unknown",
          });

          // Add intelligent delay between messages
          if (
            body.processedMessages.length > 1 &&
            results.totalSent < body.processedMessages.length
          ) {
            // Use shorter delay for small batches, longer for large ones
            const intelligentDelay = body.processedMessages.length <= 20 ? Math.min(delay, 800) : delay;
            await new Promise((resolve) => setTimeout(resolve, intelligentDelay));
          }
        } catch (error) {
          console.error(`❌ Failed to send to ${item.recipient}:`, error);
          results.totalFailed++;
          results.failures.push({
            recipient: item.recipient,
            success: false,
            error: error.message || "Failed to send message",
          });

          // Continue with next message after logging the error
          // No need to throw - just continue the loop
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
