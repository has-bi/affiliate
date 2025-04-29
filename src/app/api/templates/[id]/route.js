// app/api/templates/[id]/route.js
import { getTemplate, updateTemplate } from "@/lib/templates/templateUtils";

export async function GET(_, { params }) {
  const template = await getTemplate(params.id);
  return Response.json(template);
}

export async function PUT(req, { params }) {
  const body = await req.json();
  const result = await updateTemplate(params.id, body);
  return Response.json(result);
}
