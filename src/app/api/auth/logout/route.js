// src/app/api/auth/logout/route.js
import { logout } from "@/lib/auth/auth";

export async function POST() {
  const result = await logout();
  return Response.json(result);
}
