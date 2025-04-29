// src/app/api/messages/bulk/route.js
// Final version – Baileys-powered, no external WAHA gateway
//--------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { formatPhoneNumber } from "@/lib/utils";
import { getActiveAffiliates } from "@/lib/spreadsheetService";
import baileysClient from "@/lib/baileysClient";

/**
 * POST /api/messages/bulk
 * Body:
 * {
 *   "session"    : "default-session",   // required – for future multi‑device
 *   "recipients" : ["62812…", …],       // required – raw phone numbers
 *   "message"    : "Hello …" ,          // required – final rendered text
 *   "delay"      : 1000                 // optional ms between sends (default 0)
 * }
 */
export async function POST(request) {
  try {
    const {
      session,
      recipients = [],
      message,
      delay = 0,
    } = await request.json();

    if (!session || !recipients.length || !message) {
      return NextResponse.json(
        { error: "session, recipients and message are required" },
        { status: 400 }
      );
    }

    // 1️⃣  Load active affiliates map
    const activeMap = await getActiveAffiliates();
    const allowed = recipients.filter((p) => activeMap[p]);
    const skipped = recipients.filter((p) => !activeMap[p]);

    if (!allowed.length) {
      return NextResponse.json(
        { error: "No recipients are active affiliates", skipped },
        { status: 400 }
      );
    }

    // 2️⃣  Send sequentially (respect delay)
    let success = 0;
    const failures = [];

    for (const raw of allowed) {
      const chatId = `${formatPhoneNumber(raw)}@s.whatsapp.net`;
      try {
        await baileysClient.sendText(chatId, message);
        success += 1;
      } catch (err) {
        failures.push({ phone: raw, error: err.message });
      }
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    }

    return NextResponse.json({
      totalRequested: recipients.length,
      sentTo: allowed.length,
      skipped: skipped.length,
      success,
      failures,
    });
  } catch (error) {
    console.error("[bulk] Internal error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
