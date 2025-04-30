// src/app/api/affiliates/update-status/route.js
import { updateAffiliateStatus } from "@/lib/sheets/spreadsheetService";

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.rowIndex && !body.phone) {
      return Response.json(
        { success: false, error: "Either rowIndex or phone is required" },
        { status: 400 }
      );
    }

    const result = await updateAffiliateStatus(body);
    return Response.json(result);
  } catch (error) {
    console.error("[API] Error updating affiliate status:", error);
    return Response.json(
      { success: false, error: "Failed to update affiliate status" },
      { status: 500 }
    );
  }
}
