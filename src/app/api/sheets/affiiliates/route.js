// src/app/api/sheets/affiliates/route.js
import { NextResponse } from "next/server";
import { getAffiliates } from "@/lib/spreadsheetService";

export async function GET() {
  try {
    const affiliates = await getAffiliates();
    return NextResponse.json(affiliates);
  } catch (error) {
    console.error("Error fetching affiliates:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliates" },
      { status: 500 }
    );
  }
}
