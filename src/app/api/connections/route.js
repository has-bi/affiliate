import { NextResponse } from "next/server";
import { createSession, listSessions } from "@/lib/waSessionManager";

export async function GET() {
  return NextResponse.json({ sessions: listSessions() });
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name)
      return NextResponse.json({ error: "name required" }, { status: 400 });

    const sess = await createSession(name.trim());
    return NextResponse.json({ name: name.trim(), qr: sess.qr });
  } catch (e) {
    console.error("[connections] create failed", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
