// src/app/api/auth/login/route.js
import { login } from "@/lib/auth/auth";

export async function POST(req) {
  const body = await req.json();
  const result = await login(body);
  return Response.json(result);
}
