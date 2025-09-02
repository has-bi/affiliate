// src/middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  // Skip middleware for public paths
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/api/auth/login" ||
    request.nextUrl.pathname === "/api/messages/bulk" ||
    request.nextUrl.pathname === "/api/messages/upload-image" ||
    request.nextUrl.pathname.startsWith("/_next/") ||
    request.nextUrl.pathname.startsWith("/uploads/") ||
    request.nextUrl.pathname.includes("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Check if the user is logged in
  const isLoggedIn = request.cookies.get("is_logged_in")?.value === "true";

  if (!isLoggedIn) {
    // Redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // User is logged in, allow access
  return NextResponse.next();
}

// Define which routes the middleware applies to
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
