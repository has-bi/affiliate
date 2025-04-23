// src/app/api/templates/parameters/seed/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Initial parameter data
const initialParameters = [
  {
    id: "info_image",
    name: "Info Image",
    type: "url",
    placeholder: "Enter image URL",
    required: true,
    template_id: 6,
  },
  {
    id: "info_video",
    name: "Info Video",
    type: "url",
    placeholder: "Enter video URL",
    required: true,
    template_id: 6,
  },
  {
    id: "name",
    name: "Affiliate Name",
    type: "text",
    placeholder: "Enter affiliate name",
    required: true,
    template_id: 1,
  },
  {
    id: "name",
    name: "Affiliate Name",
    type: "text",
    placeholder: "Enter affiliate name",
    required: true,
    template_id: 2,
  },
  {
    id: "name",
    name: "Affiliate Name",
    type: "text",
    placeholder: "Enter affiliate name",
    required: true,
    template_id: 3,
  },
  {
    id: "name",
    name: "Affiliate Name",
    type: "text",
    placeholder: "Enter affiliate name",
    required: true,
    template_id: 4,
  },
  {
    id: "name",
    name: "Affiliate Name",
    type: "text",
    placeholder: "Enter affiliate name",
    required: true,
    template_id: 5,
  },
  {
    id: "name",
    name: "Affiliate Name",
    type: "text",
    placeholder: "Enter affiliate name",
    required: true,
    template_id: 6,
  },
  {
    id: "tips_image",
    name: "Tips Image",
    type: "url",
    placeholder: "Enter image URL",
    required: true,
    template_id: 3,
  },
  {
    id: "top_1_name",
    name: "Top Performer 1",
    type: "text",
    placeholder: "Enter name of top performer",
    required: true,
    template_id: 4,
  },
  {
    id: "top_2_name",
    name: "Top Performer 2",
    type: "text",
    placeholder: "Enter name of second performer",
    required: true,
    template_id: 4,
  },
  {
    id: "top_3_name",
    name: "Top Performer 3",
    type: "text",
    placeholder: "Enter name of third performer",
    required: true,
    template_id: 4,
  },
  {
    id: "video_1_link",
    name: "Top Video 1",
    type: "url",
    placeholder: "Enter URL of top video",
    required: true,
    template_id: 5,
  },
  {
    id: "video_2_link",
    name: "Top Video 2",
    type: "url",
    placeholder: "Enter URL of second video",
    required: true,
    template_id: 5,
  },
  {
    id: "video_3_link",
    name: "Top Video 3",
    type: "url",
    placeholder: "Enter URL of third video",
    required: true,
    template_id: 5,
  },
  {
    id: "video_link",
    name: "Video Link",
    type: "url",
    placeholder: "Enter video URL",
    required: true,
    template_id: 1,
  },
];

// POST /api/templates/parameters/seed - Seed initial parameter data
export async function POST(request) {
  try {
    // Delete existing parameters (optional - depends on your needs)
    // await prisma.parameter.deleteMany();

    const results = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    // Process parameters one by one
    for (const paramData of initialParameters) {
      try {
        // Adapt database field names from JSON to match Prisma schema
        const templateId = paramData.template_id;
        const { template_id, ...paramInfo } = paramData;

        // Check if parameter already exists
        const existingParam = await prisma.parameter.findFirst({
          where: {
            id: paramInfo.id,
            templateId: templateId,
          },
        });

        if (existingParam) {
          results.skipped++;
          continue;
        }

        // Create parameter
        await prisma.parameter.create({
          data: {
            ...paramInfo,
            templateId: templateId,
          },
        });

        results.created++;
      } catch (err) {
        console.error(
          `Error creating parameter ${paramData.id} for template ${paramData.template_id}:`,
          err
        );
        results.errors.push(`Parameter ${paramData.id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      message: "Parameter seeding completed",
      results,
    });
  } catch (error) {
    console.error("Error seeding parameters:", error);
    return NextResponse.json(
      { error: "Failed to seed parameters", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/templates/parameters/seed - Check parameters
export async function GET() {
  try {
    const parameters = await prisma.parameter.findMany();

    return NextResponse.json({
      message: "Parameters in database",
      parameters,
      count: parameters.length,
    });
  } catch (error) {
    console.error("Error checking parameters:", error);
    return NextResponse.json(
      { error: "Failed to check parameters", details: error.message },
      { status: 500 }
    );
  }
}
