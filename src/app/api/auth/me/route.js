// src/app/api/auth/me/route.js
import { getCurrentUser } from "@/lib/auth/auth";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json(user);
}
