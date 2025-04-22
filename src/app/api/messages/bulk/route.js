import { NextResponse } from "next/server";
import { formatPhoneNumber } from "@/lib/utils";

/**
 * POST /api/messages/bulk
 * Send a message to multiple recipients with a delay between messages
 *
 * Request body:
 * {
 *   "session": "session-name",
 *   "recipients": ["6281234567890", "6289876543210"],
 *   "message": "Hello world",
 *   "delay": 3000 // milliseconds
 * }
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    const { session, recipients, message, delay = 3000 } = body;

    if (!session || !recipients || !message) {
      return NextResponse.json(
        { error: "Missing required fields: session, recipients, message" },
        { status: 400 }
      );
    }

    // Ensure recipients is an array
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];

    // Get WAHA API URL from env
    const wahaApiUrl =
      process.env.NEXT_PUBLIC_WAHA_API_URL || "https://wabot.youvit.co.id";

    // Send messages with delay
    const results = [];

    for (const recipient of recipientList) {
      // Format phone number if needed
      const formattedChatId = recipient.includes("@c.us")
        ? recipient
        : `${formatPhoneNumber(recipient)}@c.us`;

      try {
        // Send message to WAHA API
        const response = await fetch(`${wahaApiUrl}/api/sendText`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            chatId: formattedChatId,
            text: message,
            session: session,
          }),
        });

        if (!response.ok) {
          let errorMessage = "Failed to send message";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If response is not JSON, try to get text
            errorMessage = (await response.text()) || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        results.push({
          recipient: formattedChatId,
          success: true,
          messageId: responseData.id || "unknown",
        });
      } catch (error) {
        results.push({
          recipient: formattedChatId,
          success: false,
          error: error.message || "Unknown error",
        });
      }

      // Add delay before next message (except for the last one)
      if (recipient !== recipientList[recipientList.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Process results
    const successResults = results.filter((r) => r.success);
    const failedResults = results.filter((r) => !r.success);

    return NextResponse.json({
      totalSent: successResults.length,
      totalFailed: failedResults.length,
      success: successResults,
      failures: failedResults,
    });
  } catch (error) {
    console.error("Error sending bulk messages:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
