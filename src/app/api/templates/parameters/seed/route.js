// src/app/api/templates/parameters/seed/route.js
import { seedTemplateParameters } from "@/lib/templates/templateParameterUtils";

export async function POST() {
  const result = await seedTemplateParameters();
  return Response.json(result);
}
