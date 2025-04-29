import { getNewAffiliates } from "@/lib/sheets/spreadsheetService";

export async function GET() {
  const newAffiliates = await getNewAffiliates();

  // Cleanly return only the safe, serializable data
  return Response.json(newAffiliates?.values || []);
}
