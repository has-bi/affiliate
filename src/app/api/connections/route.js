// src/app/api/connections/route.js
import baileysClient from "@/lib/whatsapp/baileysClient";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Connections]");

export async function GET() {
  try {
    const sessions = baileysClient.listSessions();
    return Response.json({ sessions });
  } catch (error) {
    logger.error("Error listing sessions:", error);
    return Response.json(
      { error: "Failed to list WhatsApp sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return Response.json(
        { error: "Valid session name is required" },
        { status: 400 }
      );
    }

    const sessionData = await baileysClient.initSession(name);
    return Response.json(sessionData);
  } catch (error) {
    logger.error("Error creating session:", error);
    return Response.json(
      { error: error.message || "Failed to create WhatsApp session" },
      { status: 500 }
    );
  }
}
