// src/app/api/connections/route.js
import wahaClient from "@/lib/whatsapp/wahaClient";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Connections]");

// Cache at the module level
let sessionCache = null;
let lastCheckTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function GET() {
  try {
    const now = Date.now();

    // Return cached result if valid
    if (sessionCache && now - lastCheckTime < CACHE_TTL) {
      logger.info("Using cached session info");
      return Response.json({
        sessions: [sessionCache],
        cached: true,
      });
    }

    // Get fresh data
    const sessionInfo = await wahaClient.checkSession();
    logger.info(`Session status: ${JSON.stringify(sessionInfo)}`);

    // Update cache
    sessionCache = sessionInfo;
    lastCheckTime = now;

    return Response.json({
      sessions: [sessionInfo],
    });
  } catch (error) {
    logger.error("Error checking session:", error);

    // Create a fallback response
    const fallbackResponse = {
      name: wahaClient.defaultSession,
      isConnected: false,
      status: "ERROR",
      error: error.message || "Unknown error",
    };

    // Still cache the error response to prevent constant retries
    sessionCache = fallbackResponse;
    lastCheckTime = Date.now();

    return Response.json({
      sessions: [fallbackResponse],
    });
  }
}
