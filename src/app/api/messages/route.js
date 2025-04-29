// src/app/api/messages/route.js
import { sendMessage } from "@/lib/whatsapp/baileysClient";

export async function POST(req) {
  const body = await req.json();
  const result = await sendMessage(body);
  return Response.json(result);
}
