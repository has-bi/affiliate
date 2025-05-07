// src/app/api/auth/login/route.js
import { login } from "@/lib/auth/auth";
import { cookies } from "next/headers";

export async function POST(req) {
  console.log("API: Login request received");
  try {
    const body = await req.json();
    console.log("API: Request body parsed");

    const result = await login(body);
    console.log("API: Login result", result);

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
