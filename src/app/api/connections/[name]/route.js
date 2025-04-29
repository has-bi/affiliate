// --- src/app/api/connections/[name]/qr/route.js -----------------------------
import { NextResponse } from "next/server";
import { getSession } from "@/lib/waSessionManager";

export async function GET(_req, { params }) {
  const sess = getSession(params.name);
  if (!sess) return NextResponse.json({ error: "not-found" }, { status: 404 });
  return NextResponse.json({ qr: sess.qr }); // qr === null once paired
}
