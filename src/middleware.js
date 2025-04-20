// src/middleware.js

import { NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export function middleware(request) {
  // Get the token from cookie
  const token = request.cookies.get("auth-token")?.value;

  // If no token or invalid token, redirect to login
  if (!token || !verifyToken(token)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Optimize matcher for Vercel - only check routes that need protection
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/broadcasts/:path*",
    "/schedules/:path*",
    "/template-broadcast/:path*",
    "/api/schedules/:path*",
    "/api/waha/:path*",
    // exclude login-related paths
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
