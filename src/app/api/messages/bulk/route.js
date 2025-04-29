// src/app/api/messages/bulk/route.js
import { sendBulkMessages } from "@/lib/whatsapp/baileysClient";

export async function POST(req) {
  const body = await req.json();
  const result = await sendBulkMessages(body);
  return Response.json(result);
}
