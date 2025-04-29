// src/app/api/connections/[name]/qr/route.js
import { NextResponse } from "next/server";
import baileysClient from "@/lib/baileysClient";

export async function GET(request, context) {
  try {
    // Use context.params instead of destructuring directly
    const name = context.params.name;

    const session = baileysClient.getSession(name);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ qr: session.qrCode });
  } catch (error) {
    console.error(
      `Error getting QR code for session ${context.params.name}:`,
      error
    );
    return NextResponse.json(
      { error: error.message || "Failed to get QR code" },
      { status: 500 }
    );
  }
}
