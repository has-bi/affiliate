// src/app/api/messages/route.js
import { NextResponse } from "next/server";
import { formatPhoneNumber } from "@/lib/utils";

/**
 * POST /api/messages
 * Send a message to one or more recipients
 *
 * Request body:
 * {
 *   "session": "session-name",
 *   "recipients": ["6281234567890", "6289876543210"],
 *   "message": "Hello world"
 * }
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    const { session, recipients, message } = body;

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

    // Send message to all recipients
    const results = await Promise.allSettled(
      recipientList.map(async (recipient) => {
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
          return {
            recipient: formattedChatId,
            success: true,
            messageId: responseData.id || "unknown",
          };
        } catch (error) {
          return {
            recipient: formattedChatId,
            success: false,
            error: error.message || "Unknown error",
          };
        }
      })
    );

    // Process results
    const successResults = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    );
    const failedResults = results.filter(
      (r) =>
        r.status === "rejected" ||
        (r.status === "fulfilled" && !r.value.success)
    );

    return NextResponse.json({
      totalSent: successResults.length,
      totalFailed: failedResults.length,
      success: successResults.map((r) => r.value),
      failures: failedResults.map((r) =>
        r.status === "rejected" ? { error: r.reason.message } : r.value
      ),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
