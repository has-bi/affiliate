// src/app/api/templates/route.js
import { listTemplates } from "@/lib/templates/templateUtils";

export async function GET() {
  const templates = await listTemplates();
  return Response.json(templates);
}
