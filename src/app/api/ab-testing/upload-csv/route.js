// src/app/api/ab-testing/upload-csv/route.js
import { NextResponse } from "next/server";
import { CSVParser } from "@/lib/utils/csvParser";

/**
 * POST /api/ab-testing/upload-csv
 * Parse and validate CSV file for A/B testing recipients
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    const fileValidation = CSVParser.validateFile(file);
    if (!fileValidation.isValid) {
      return NextResponse.json(
        { 
          error: "Invalid file", 
          details: fileValidation.errors 
        },
        { status: 400 }
      );
    }

    // Read file content
    const csvText = await file.text();

    // Parse CSV
    const parseResult = CSVParser.parseCSV(csvText);

    // Return results
    return NextResponse.json({
      success: true,
      data: {
        recipients: parseResult.recipients,
        totalRows: parseResult.totalRows,
        processedRows: parseResult.processedRows,
        errors: parseResult.errors,
        columns: {
          name: parseResult.nameColumn,
          phone: parseResult.phoneColumn
        }
      },
      meta: {
        fileName: file.name,
        fileSize: file.size,
        expectedColumns: CSVParser.getExpectedColumns()
      }
    });

  } catch (error) {
    console.error("Error processing CSV upload:", error);
    return NextResponse.json(
      { 
        error: "Failed to process CSV file",
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ab-testing/upload-csv
 * Get sample CSV format and expected columns
 */
export async function GET() {
  try {
    const sampleCSV = CSVParser.generateSampleCSV();
    const expectedColumns = CSVParser.getExpectedColumns();

    return NextResponse.json({
      sampleCSV,
      expectedColumns,
      instructions: {
        nameColumn: "Must contain one of: " + expectedColumns.name.join(", "),
        phoneColumn: "Must contain one of: " + expectedColumns.phone.join(", "),
        phoneFormat: "Supports Indonesian phone numbers with or without country code (+62, 62, 08, 8)",
        fileRequirements: [
          "CSV format only",
          "Maximum file size: 5MB",
          "Must have header row",
          "At least one data row"
        ]
      }
    });
  } catch (error) {
    console.error("Error getting CSV sample:", error);
    return NextResponse.json(
      { error: "Failed to get sample CSV" },
      { status: 500 }
    );
  }
}