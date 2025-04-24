// src/app/api/contacts/route.js
import { NextResponse } from "next/server";
import { initSheets } from "@/lib/sheets-api";

/**
 * GET /api/affiliates/new
 * Get all contacted affiliate contacts from master sheet
 */
export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Initialize Google Sheets
    const doc = await initSheets();
    const sheet = doc.sheetsByTitle["Form Responses 1"];

    // Load the rows
    await sheet.loadHeaderRow();
    const headerValues = sheet.headerValues;

    // Find important column indices
    const statusIndex = headerValues.findIndex((h) => h === "Status");
    const nameIndex = headerValues.findIndex((h) => h === "Isi nama kamu");
    const phoneIndex = headerValues.findIndex((h) =>
      h.includes("Nomor WhatsApp")
    );
    const platformIndex = headerValues.findIndex((h) => h.includes("platform"));
    const emailIndex = headerValues.findIndex((h) => h.includes("Email"));
    const timestampIndex = headerValues.findIndex((h) => h === "Timestamp");

    // Get all rows
    const rows = await sheet.getRows();

    // Filter rows by status and search term
    const filteredRows = rows.filter((row) => {
      // Check status match
      const rowStatus = row._rawData[statusIndex];
      const statusMatch = status === "all" || rowStatus === status;

      // Check search match if searchTerm provided
      let searchMatch = true;
      if (searchTerm) {
        const name = row._rawData[nameIndex] || "";
        const phone = row._rawData[phoneIndex] || "";
        const searchLower = searchTerm.toLowerCase();
        searchMatch =
          name.toLowerCase().includes(searchLower) ||
          phone.toString().includes(searchLower);
      }

      return statusMatch && searchMatch;
    });

    // Paginate results
    const startIndex = (page - 1) * limit;
    const paginatedRows = filteredRows.slice(startIndex, startIndex + limit);

    // Format the result
    const contacts = paginatedRows.map((row) => {
      return {
        id: rows.indexOf(row), // Use row index as ID
        name: row._rawData[nameIndex] || "",
        phone: row._rawData[phoneIndex] || "",
        platform: row._rawData[platformIndex] || "",
        email: row._rawData[emailIndex] || "",
        status: row._rawData[statusIndex] || "",
        timestamp: row._rawData[timestampIndex] || "",
        rowIndex: rows.indexOf(row),
      };
    });

    // Return the response
    return NextResponse.json({
      contacts,
      pagination: {
        total: filteredRows.length,
        page,
        limit,
        totalPages: Math.ceil(filteredRows.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
