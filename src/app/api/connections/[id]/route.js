// src/app/api/connections/[id]/route.js
import wahaClient from "@/lib/whatsapp/wahaClient";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Connection]");

export async function GET(request, context) {
  const id = context.params.id;

  try {
    logger.info(`Getting session: ${id}`);
    const session = await wahaClient.getSession(id);

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
