// src/app/api/affiliates/update-status/route.js
import { updateAffiliateStatus } from "@/lib/sheets/spreadsheetService";

export async function POST(req) {
  const body = await req.json();
  const result = await updateAffiliateStatus(body);
  return Response.json(result);
}
