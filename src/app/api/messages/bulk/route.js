// src/app/api/messages/bulk/route.js (ensure this is properly implemented)
import { sendBulkMessages } from "@/lib/whatsapp/baileysClient";
import { logBroadcast } from "@/lib/sheets/spreadsheetService";

export async function POST(req) {
  try {
    const body = await req.json();

    // Send the messages
    const result = await sendBulkMessages(body);

    // Log the broadcast
    await logBroadcast({
      type: "manual",
      recipients: body.recipients,
      success: result.totalSent,
      failed: result.totalFailed,
      notes: `Template: ${body.templateName || "Unknown"}`,
    });

    return Response.json(result);
  } catch (error) {
    console.error("[API] Error sending bulk messages:", error);
    return Response.json(
      { error: error.message || "Failed to send messages" },
      { status: 500 }
    );
  }
}
