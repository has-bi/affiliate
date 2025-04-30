// src/app/api/affiliates/route.js
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
      const newAffiliates = await getNewAffiliates();
      console.log(`Returning ${newAffiliates.length} new affiliates`);
      affiliatesData = newAffiliates;
    } else if (status === "active") {
      const activeAffiliates = await getActiveAffiliates();
      console.log(`Returning ${activeAffiliates.length} active affiliates`);
      affiliatesData = activeAffiliates;
    } else {
      // If no status specified, return both with counts
      const newAffiliates = await getNewAffiliates();
      const activeAffiliates = await getActiveAffiliates();

      console.log(
        `Combined response: ${newAffiliates.length} new, ${activeAffiliates.length} active`
      );

      affiliatesData = {
        new: newAffiliates,
        active: activeAffiliates,
        counts: {
          new: newAffiliates.length,
          active: activeAffiliates.length,
        },
      };
    }

    return Response.json(affiliatesData);
  } catch (error) {
    console.error("[API] Error fetching affiliates:", error);
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
