// app/api/templates/[id]/route.js
import { getTemplate, updateTemplate } from "@/lib/templates/templateUtils";

export async function GET(_, { params }) {
  const id = params?.id; // Access using optional chaining
  const template = await getTemplate(id);
  return Response.json(template);
}

export async function PUT(req, { params }) {
  const body = await req.json();
  const result = await updateTemplate(params.id, body);
  return Response.json(result);
}
