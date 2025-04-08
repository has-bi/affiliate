// app/api/sendText/route.js
import { NextResponse } from "next/server";
import { formatPhoneNumber } from "../../../lib/utils";

/**
 * POST /api/sendText
 * Sends a text message to a WhatsApp recipient
 *
 * Request body:
 * {
 *   "chatId": "6282284477640@c.us",
 *   "text": "Hi there!",
 *   "session": "hasbi-test"
 * }
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    const { chatId, text, session } = body;

    if (!chatId || !text || !session) {
      return NextResponse.json(
        { error: "Missing required fields: chatId, text, session" },
        { status: 400 }
      );
    }

    // Format phone number if needed
    const formattedChatId = chatId.includes("@c.us")
      ? chatId
      : `${formatPhoneNumber(chatId)}@c.us`;

    // Get WAHA API URL from env
    const wahaApiUrl =
      process.env.NEXT_PUBLIC_WAHA_API_URL || "https://wabot.youvit.co.id";

    // Send message to WAHA API
    const response = await fetch(`${wahaApiUrl}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        chatId: formattedChatId,
        text: text,
        session: session,
      }),
    });

    // Handle API response
    if (!response.ok) {
      let errorMessage = "Failed to send message";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        errorMessage = (await response.text()) || errorMessage;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Return successful response
    const responseData = await response.json();
    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
