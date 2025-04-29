// src/app/api/messages/bulk/route.js
// Final version – filters recipients to ACTIVE affiliates only and sends
// messages sequentially with an optional delay via WAHA API.
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";

import { formatPhoneNumber } from "@/lib/utils";
import { getActiveAffiliates } from "@/lib/spreadsheetService";

const WAHA_URL =
  process.env.NEXT_PUBLIC_WAHA_API_URL || "https://wabot.youvit.co.id";

/**
 * POST /api/messages/bulk
 * Body:
 * {
 *   "session"    : "default-session",   // required
 *   "recipients" : ["628123…", …],      // required – raw phone strings
 *   "message"    : "Hello …",            // required – fully rendered text
 *   "delay"      : 3000                  // optional ms between sends (default 0)
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

    // -----------------------------------------------------------------------
    // 1️⃣  Get map of active affiliates – key = raw phone (numbers only)
    // -----------------------------------------------------------------------
    const activeMap = await getActiveAffiliates();

    // Filter recipients → only those in activeMap
    const allowed = recipients.filter((p) => activeMap[p]);
    const skipped = recipients.filter((p) => !activeMap[p]);

    if (!allowed.length) {
      return NextResponse.json(
        { error: "No recipients are active affiliates", skipped },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // 2️⃣  Send sequentially (delay in‑between) – can be optimised to parallel
    // -----------------------------------------------------------------------
    let success = 0;
    let failures = [];

    for (const raw of allowed) {
      const chatId = formatPhoneNumber(raw);

      try {
        const res = await fetch(`${WAHA_URL}/api/sendText`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, text: message, session }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
