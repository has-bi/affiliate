// src/app/api/sheets/update-status/route.js
import { NextResponse } from "next/server";
import {
  updateAffiliateStatusByPhone,
  updateAffiliateStatus,
} from "@/lib/spreadsheetService";

export async function POST(request) {
  try {
    const { phone, rowIndex, status } = await request.json();

    let updated = false;

    // Try to update by phone first if provided
    if (phone) {
      updated = await updateAffiliateStatusByPhone(
        phone,
        status || "contacted"
      );
    }
    // Otherwise try to update by row index
    else if (rowIndex !== undefined) {
      updated = await updateAffiliateStatus(rowIndex, status || "contacted");
    } else {
      return NextResponse.json(
        { error: "Either phone number or row index is required" },
        { status: 400 }
      );
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Affiliate not found or could not be updated" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating affiliate status:", error);
    return NextResponse.json(
      { error: "Failed to update affiliate status" },
      { status: 500 }
    );
  }
}
