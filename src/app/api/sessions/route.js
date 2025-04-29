// src/app/api/sessions/route.js
import { listSessions } from "@/lib/whatsapp/waSessionManager";

export async function GET() {
  const sessions = await listSessions();
  return Response.json(sessions);
}
