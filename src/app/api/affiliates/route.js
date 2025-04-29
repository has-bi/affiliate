import { getAffiliates } from "@/lib/sheets/spreadsheetService";

export async function GET() {
  const affiliates = await getAffiliates();
  return Response.json(affiliates);
}
