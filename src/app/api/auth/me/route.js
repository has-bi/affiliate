// src/app/api/auth/me/route.js

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request) {
  // Get the token from cookie
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
