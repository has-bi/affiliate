// src/app/api/messages/route.js
import { NextResponse } from "next/server";
import baileysClient from "@/lib/baileysClient";

export async function POST(request) {
  try {
    const body = await request.json();
    const { session, recipients, message } = body;

    if (!session || !recipients || !message) {
      return NextResponse.json(
        { error: "Session, recipients, and message are required" },
        { status: 400 }
      );
    }

    // Ensure recipients is an array
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];

    // Send messages
    const results = await Promise.allSettled(
      recipientList.map(async (recipient) => {
        try {
          const result = await baileysClient.sendText(
            session,
            recipient,
            message
          );
          return {
            recipient,
            success: true,
            messageId: result.key?.id || "unknown",
          };
        } catch (error) {
          return { recipient, success: false, error: error.message };
        }
      })
    );

    // Process results
    const successResults = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    );
    const failureResults = results.filter(
      (r) =>
        r.status === "rejected" ||
        (r.status === "fulfilled" && !r.value.success)
    );

    return NextResponse.json({
      totalSent: successResults.length,
      totalFailed: failureResults.length,
      success: successResults.map((r) => r.value),
      failures: failureResults.map((r) =>
        r.status === "rejected"
          ? { error: r.reason?.message || "Unknown error" }
          : r.value
      ),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
