// /src/app/api/affiliates/route.js
import {
  getActiveAffiliates,
  getNewAffiliates,
} from "@/lib/sheets/spreadsheetService";

export async function GET(request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Fetch the appropriate data based on status
    let affiliatesData;

    if (status === "new") {
      affiliatesData = await getNewAffiliates();
    } else if (status === "active") {
      affiliatesData = await getActiveAffiliates();
    } else {
      // If no status specified, return both with counts
      const newAffiliates = await getNewAffiliates();
      const activeAffiliates = await getActiveAffiliates();

      affiliatesData = {
        new: newAffiliates,
        active: Object.values(activeAffiliates),
        counts: {
          new: newAffiliates.length,
          active: Object.keys(activeAffiliates).length,
        },
      };
    }

    return Response.json(affiliatesData);
  } catch (error) {
    console.error("[API] Error fetching affiliates:", error);

    // Return error response with fallback data
    return Response.json(
      {
        error: "Failed to fetch affiliates",
        new: [],
        active: [],
        counts: { new: 0, active: 0 },
      },
      { status: 500 }
    );
  }
}
