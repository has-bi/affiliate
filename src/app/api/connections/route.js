// src/app/api/connections/route.js
import { NextResponse } from "next/server";
import baileysClient from "@/lib/baileysClient";

export async function GET(request) {
  try {
    const sessions = baileysClient.listSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error listing sessions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Valid session name is required" },
        { status: 400 }
      );
    }

    const session = await baileysClient.initSession(name);
    return NextResponse.json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}
