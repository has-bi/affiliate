// src/app/api/contacts/new/route.js
import { NextResponse } from "next/server";
import { getNewAffiliates } from "@/lib/sheets/spreadsheetService";

export async function GET() {
  try {
    const newAffiliates = await getNewAffiliates();
    
    // Transform the data for frontend consumption
    const contacts = newAffiliates.map(affiliate => ({
      name: affiliate.name || 'Unknown',
      phone: affiliate.phone,
      platform: affiliate.platform || 'Not specified',
      instagramUsername: affiliate.instagramUsername,
      tiktokUsername: affiliate.tiktokUsername,
      shopeeUsername: affiliate.shopeeUsername
    }));

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching new contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch new contacts" },
      { status: 500 }
    );
  }
}