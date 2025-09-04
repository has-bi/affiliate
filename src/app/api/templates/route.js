// src/app/api/templates/route.js
import { listTemplates, createTemplate } from "@/lib/templates/templateUtils";

export async function GET() {
  const templates = await listTemplates();
  return Response.json(templates);
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch (err) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // DEBUG: Log received template data
  console.log('DEBUG Template API - Received data:', {
    ...payload,
    parameters: payload.parameters ? `[${payload.parameters.length} parameters]` : 'none'
  });
  console.log('DEBUG Template API - payload.imageUrl:', payload.imageUrl);

  const { name, content } = payload;

  if (!name?.trim() || !content?.trim()) {
    return Response.json(
      { error: "`name` and `content` are required fields" },
      { status: 400 }
    );
  }

  try {
    const templateData = {
      name: name.trim(),
      content: content.trim(),
      description: payload.description?.trim() || "",
      category: payload.category || "general",
      imageUrl: payload.imageUrl || null, // Include imageUrl
      parameters: Array.isArray(payload.parameters) ? payload.parameters : [],
    };

    console.log('DEBUG Template API - Creating template with data:', templateData);

    const newTemplate = await createTemplate(templateData);

    return Response.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return Response.json(
      {
        error: error?.message?.includes("Unique constraint")
          ? "A template with that name already exists"
          : "Failed to create template",
      },
      { status: 500 }
    );
  }
}
