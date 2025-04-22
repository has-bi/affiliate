// src/app/api/sessions/route.js
import { NextResponse } from "next/server";

export async function GET() {
  const wahaApiUrl =
    process.env.NEXT_PUBLIC_WAHA_API_URL || "https://wabot.youvit.co.id";

  try {
    // Forward request to actual WAHA API
    const response = await fetch(`${wahaApiUrl}/api/sessions`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching all sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions data" },
      { status: 500 }
    );
  }
}
