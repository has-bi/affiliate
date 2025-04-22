// app/api/templates/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/templates/[id] - Get a template by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const templateId = parseInt(id, 10);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    const template = await prisma.template.findUnique({
      where: {
        id: templateId,
      },
      include: {
        parameters: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error(`Error fetching template:`, error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - Update a template
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const templateId = parseInt(id, 10);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Update template with parameters (transaction ensures all or nothing)
    const updatedTemplate = await prisma.$transaction(async (tx) => {
      // Delete existing parameters
      await tx.parameter.deleteMany({
        where: { templateId },
      });

      // Update template
      return await tx.template.update({
        where: { id: templateId },
        data: {
          name: data.name,
          description: data.description || "",
          content: data.content,
          category: data.category || "general",
          updatedAt: new Date(),
          parameters: {
            create:
              data.parameters?.map((param) => ({
                id: param.id,
                name: param.name,
                type: param.type || "text",
                placeholder: param.placeholder || "",
                required: param.required || false,
              })) || [],
          },
        },
        include: {
          parameters: true,
        },
      });
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error(`Error updating template:`, error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const templateId = parseInt(id, 10);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Delete template (this will cascade delete parameters due to the relation)
    await prisma.template.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting template:`, error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
