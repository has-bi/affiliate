// src/app/api/auth/login/route.js
import { login } from "@/lib/auth/auth";
import { cookies } from "next/headers";

export async function POST(req) {
  
  try {
    const body = await req.json();
    
    const result = await login(body);
    
    // If login successful, set the cookie that middleware is checking for
    if (result.success) {
      const cookieStore = cookies();
      cookieStore.set("is_logged_in", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });
    }

    return Response.json(result);
  } catch (error) {
    console.error("API: Login error:", error);
    return Response.json(
      { success: false, error: error.message || "Authentication failed" },
      { status: 400 }
    );
  }
}
