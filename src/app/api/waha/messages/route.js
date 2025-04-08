// app/api/waha/messages/route.js
import { NextResponse } from "next/server";

/**
 * POST /api/waha/messages
 * Send message to one or multiple recipients
 */
export async function POST(request) {
  const wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_API_URL;

  try {
    const { session, recipients, message } = await request.json();

    if (!session || !recipients || !message) {
      return NextResponse.json(
        { error: "Missing required parameters: session, recipients, message" },
        { status: 400 }
      );
    }

    // Check if recipients is an array or a single value
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];

    // Send message to each recipient
    const results = await Promise.allSettled(
      recipientList.map(async (recipient) => {
        const response = await fetch(
          `${wahaApiUrl}/api/sessions/${session}/chats/${recipient}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              text: message,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        return await response.json();
      })
    );

    // Process results
    const successfulSends = results.filter((r) => r.status === "fulfilled");
    const failedSends = results.filter((r) => r.status === "rejected");

    return NextResponse.json({
      totalSent: successfulSends.length,
      totalFailed: failedSends.length,
      success: successfulSends.map((r) => r.value),
      failures: failedSends.map((r) => r.reason.message),
    });
  } catch (error) {
    console.error("Error sending messages:", error);
    return NextResponse.json(
      { error: "Failed to send messages" },
      { status: 500 }
    );
  }
}
