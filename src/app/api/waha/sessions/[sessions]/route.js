// app/api/waha/sessions/[session]/route.js
import { NextResponse } from "next/server";

/**
 * GET /api/waha/sessions/[session]
 * Fetch info for a specific WAHA session
 */
export async function GET(request, { params }) {
  const { session } = params;
  const wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_API_URL;

  try {
    // Forward request to actual WAHA API
    const response = await fetch(`${wahaApiUrl}/api/sessions/${session}`, {
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
    console.error(`Error fetching session ${session}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch session data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/waha/sessions/[session]
 * Create or update a WAHA session
 */
export async function POST(request, { params }) {
  const { session } = params;
  const wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_API_URL;

  try {
    const body = await request.json();

    // Forward request to actual WAHA API
    const response = await fetch(`${wahaApiUrl}/api/sessions/${session}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
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
    console.error(`Error creating/updating session ${session}:`, error);
    return NextResponse.json(
      { error: "Failed to create/update session" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/waha/sessions/[session]
 * Delete a WAHA session
 */
export async function DELETE(request, { params }) {
  const { session } = params;
  const wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_API_URL;

  try {
    // Forward request to actual WAHA API
    const response = await fetch(`${wahaApiUrl}/api/sessions/${session}`, {
      method: "DELETE",
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting session ${session}:`, error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
