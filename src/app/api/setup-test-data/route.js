// src/app/api/setup-test-data/route.js
import { setupTestData } from "@/lib/sheets/spreadsheetService";

export async function GET() {
  const result = await setupTestData();
  return Response.json(result);
}
