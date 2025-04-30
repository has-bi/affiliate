// src/app/api/connections/[id]/route.js
import baileysClient from "@/lib/whatsapp/baileysClient";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Connection]");

export async function GET(request, context) {
  const id = context.params.id;

  try {
    logger.info(`Getting session: ${id}`);
    const session = baileysClient.getSession(id);

    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json(session);
  } catch (error) {
    logger.error(`Error getting session ${id}:`, error);
    return Response.json(
      { error: "Failed to get session information" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  const id = context.params.id;

  try {
    logger.info(`Deleting session: ${id}`);
    const result = await baileysClient.deleteSession(id);

    if (!result) {
      return Response.json(
        { error: "Session not found or failed to delete" },
        { status: 404 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    logger.error(`Error deleting session ${id}:`, error);
    return Response.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
