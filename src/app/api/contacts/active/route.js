// src/app/api/contacts/active/route.js
import { NextResponse } from "next/server";
import { getActiveAffiliates } from "@/lib/sheets/spreadsheetService";

export async function GET() {
  try {
    const activeAffiliates = await getActiveAffiliates();
    
    // Transform the data for frontend consumption
    const contacts = activeAffiliates.map(affiliate => ({
      name: affiliate.name || 'Unknown',
      phone: affiliate.phone,
      platform: affiliate.platform || 'Not specified',
      instagramUsername: affiliate.instagramUsername,
      tiktokUsername: affiliate.tiktokUsername,
      shopeeUsername: affiliate.shopeeUsername
    }));

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching active contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch active contacts" },
      { status: 500 }
    );
  }
}