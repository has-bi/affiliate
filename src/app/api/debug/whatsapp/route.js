// src/app/api/debug/whatsapp/route.js
import wahaClient from "@/lib/whatsapp/wahaClient";

export async function GET(request) {
  try {
    // Check session status
    const sessionStatus = await wahaClient.checkSession();

    return Response.json({
      message: "WhatsApp session status",
      status: sessionStatus,
    });
  } catch (error) {
    console.error("WhatsApp status error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, text, session } = body;

    if (!to || !text) {
      return Response.json(
        {
          error: "Both 'to' and 'text' parameters are required",
        },
        { status: 400 }
      );
    }

    // Send a test message
    const result = await wahaClient.sendText(
      session || undefined, // Will use default if not provided
      to,
      text
    );

    return Response.json({
      message: "Test message sent",
      result,
    });
  } catch (error) {
    console.error("Send test message error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
