// src/app/api/auth/me/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  // Check for the login cookie
  const isLoggedIn = request.cookies.get("is_logged_in")?.value === "true";

  if (!isLoggedIn) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Return basic info - since this is a personal app, we can hardcode it
  // or use environment variables
  return NextResponse.json({
    authenticated: true,
    user: {
      username: process.env.ADMIN_USERNAME || "admin",
      role: "admin",
    },
  });
}
