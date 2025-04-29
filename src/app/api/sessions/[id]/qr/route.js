import { getSessionQRCode } from "@/lib/whatsapp/waSessionManager";

export async function GET(_, { params }) {
  const qrCode = await getSessionQRCode(params.id);
  return Response.json(qrCode);
}
