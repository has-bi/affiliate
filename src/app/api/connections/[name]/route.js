// src/app/api/connections/[name]/route.js
import { NextResponse } from "next/server";
import baileysClient from "@/lib/baileysClient";

export async function GET(request, { params }) {
  try {
    const { name } = params;
    const session = baileysClient.getSession(name);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error(`Error getting session ${params.name}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to get session" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { name } = params;
    const success = await baileysClient.deleteSession(name);

    if (!success) {
      return NextResponse.json(
        { error: "Session not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting session ${params.name}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to delete session" },
      { status: 500 }
    );
  }
}
