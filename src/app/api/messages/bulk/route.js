// src/app/api/messages/bulk/route.js
import { NextResponse } from "next/server";
import baileysClient from "@/lib/baileysClient";

export async function POST(request) {
  try {
    const body = await request.json();
    const { session, recipients = [], message, delay = 0 } = body;

    if (!session || !recipients.length || !message) {
      return NextResponse.json(
        { error: "Session, recipients, and message are required" },
        { status: 400 }
      );
    }

    // Results tracking
    let success = 0;
    let failures = [];

    // Send messages sequentially with delay
    for (const recipient of recipients) {
      try {
        await baileysClient.sendText(session, recipient, message);
        success++;
      } catch (error) {
        failures.push({
          recipient,
          error: error.message || "Failed to send message",
        });
      }

      // Apply delay if specified and not the last recipient
      if (delay > 0 && recipient !== recipients[recipients.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return NextResponse.json({
      totalRequested: recipients.length,
      totalSent: success,
      totalFailed: failures.length,
      failures,
    });
  } catch (error) {
    console.error("Error sending bulk messages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send bulk messages" },
      { status: 500 }
    );
  }
}
