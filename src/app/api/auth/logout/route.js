// src/app/api/auth/logout/route.js
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();

  // Delete the auth cookie
  cookieStore.delete("auth_token");

  return Response.json({ success: true });
}
