// src/app/api/connections/[id]/qr/route.js
import baileysClient from "@/lib/whatsapp/baileysClient";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][ConnectionQR]");

export const runtime = "nodejs";
export async function GET(request, { params }) {
  // Extract id from context.params directly
  const id = params;

  try {
    logger.info(`Getting QR code for session: ${id}`);
    const qr = baileysClient.getSessionQRCode(id);

    logger.info(`QR code for session ${id}: ${qr ? "Found" : "Not found"}`);

    return Response.json({ qr });
  } catch (error) {
    logger.error(`Error getting QR code for session ${id}:`, error);
    return Response.json({ error: "Failed to get QR code" }, { status: 500 });
  }
}
