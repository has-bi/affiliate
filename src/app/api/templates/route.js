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

  const { name, content } = payload;

  if (!name?.trim() || !content?.trim()) {
    return Response.json(
      { error: "`name` and `content` are required fields" },
      { status: 400 }
    );
  }

  try {
    const newTemplate = await createTemplate({
      name: name.trim(),
      content: content.trim(),
      description: payload.description?.trim() || "",
      category: payload.category || "general",
      parameters: Array.isArray(payload.parameters) ? payload.parameters : [],
    });

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
