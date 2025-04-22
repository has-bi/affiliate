// app/api/templates/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/templates - Retrieve all templates
export async function GET() {
  try {
    // Get all templates with their parameters
    const templates = await prisma.template.findMany({
      include: {
        parameters: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create a new template
export async function POST(request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    // Extract parameters to be created
    const parameters =
      data.parameters?.map((param) => ({
        id: param.id,
        name: param.name,
        type: param.type || "text",
        placeholder: param.placeholder || "",
        required: param.required || false,
      })) || [];

    // Create the template with parameters
    const newTemplate = await prisma.template.create({
      data: {
        name: data.name,
        description: data.description || "",
        content: data.content,
        category: data.category || "general",
        parameters: {
          create: parameters,
        },
      },
      include: {
        parameters: true,
      },
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
