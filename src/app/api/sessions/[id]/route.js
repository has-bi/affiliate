// src/app/api/sessions/[id]/route.js
import { getSession, deleteSession } from "@/lib/whatsapp/waSessionManager";

export async function GET(_, { params }) {
  const session = await getSession(params.id);
  return Response.json(session);
}

export async function DELETE(_, { params }) {
  const result = await deleteSession(params.id);
  return Response.json(result);
}
