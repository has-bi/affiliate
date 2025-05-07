// src/app/api/connections/route.js
import wahaClient from "@/lib/whatsapp/wahaClient";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Connections]");

export async function GET() {
  try {
    const sessionInfo = await wahaClient.checkSession();
    logger.info(`Session status: ${JSON.stringify(sessionInfo)}`);

    return Response.json({
      sessions: [sessionInfo],
    });
  } catch (error) {
    logger.error("Error checking session:", error);
    return Response.json({
      sessions: [
        {
          name: wahaClient.defaultSession,
          isConnected: false,
          status: "ERROR",
          error: error.message || "Unknown error occurred",
        },
      ],
    });
  }
}
