// src/app/api/auth/me/route.js
import { cookies } from "next/headers";

export async function GET() {
  // Get auth cookie
  const cookieStore = cookies();
  const authCookie = cookieStore.get("auth_token");

  // If no cookie exists, user is not authenticated
  if (!authCookie) {
    return Response.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  // In a real app, you'd verify the token here
  // For now, simply return the user info
  return Response.json({
    success: true,
    user: {
      id: "1",
      name: "Admin User",
      role: "admin",
    },
  });
}
