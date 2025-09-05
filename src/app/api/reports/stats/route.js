// src/app/api/reports/stats/route.js
import messageHistory from "@/lib/services/messageHistory";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Reports][Stats]");

export async function GET(req) {
  try {
    const overallStats = messageHistory.getOverallStats();

    return Response.json({
      success: true,
      stats: overallStats
    });

  } catch (error) {
    logger.error("Failed to get overall stats:", error);
    return Response.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}