// src/app/api/affiliates/new/route.js
import { NextResponse } from "next/server";
import { getNewAffiliates } from "@/lib/spreadsheetService";

export async function GET() {
  try {
    const newAffiliates = await getNewAffiliates();
    return NextResponse.json(newAffiliates);
  } catch (error) {
    console.error("Error fetching new affiliates:", error);
    return NextResponse.json(
      { error: "Failed to fetch new affiliates" },
      { status: 500 }
    );
  }
}
