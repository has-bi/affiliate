// app/templates/page.js
import { Suspense } from "react";
import { notFound } from "next/navigation";
import TemplatesPageTemplate from "@/components/templates/TemplatesPageTemplate";
import prisma from "@/lib/prisma";

// Server component to fetch templates
async function getTemplates() {
  try {
    const templates = await prisma.template.findMany({
      include: {
        parameters: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return templates;
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
}

// Server component to validate template ID
async function validateTemplateId(id) {
  if (!id) return null;

  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return null;

  // Check if template exists
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  return template ? templateId : null;
}

export default async function TemplatesPage({ searchParams }) {
  // Get the requested template ID from URL params
  const requestedId = searchParams.id;

  // Fetch all templates
  const templates = await getTemplates();

  // Validate the requested template ID
  const validatedId = await validateTemplateId(requestedId);

  // If an invalid ID was provided, return 404
  if (requestedId && !validatedId) {
    notFound();
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplatesPageTemplate templates={templates} selectedId={validatedId} />
    </Suspense>
  );
}
