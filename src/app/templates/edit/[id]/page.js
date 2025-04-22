// app/templates/edit/[id]/page.js
import { Suspense } from "react";
import { MessageSquare, Edit } from "lucide-react";
import TemplateForm from "@/components/organisms/TemplateForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Template",
  description: "Edit an existing message template",
};

// Server component to fetch template data
async function getTemplateById(id) {
  const templateId = parseInt(id, 10);

  if (isNaN(templateId)) {
    return null;
  }

  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { parameters: true },
    });

    return template;
  } catch (error) {
    console.error(`Error fetching template ${id}:`, error);
    return null;
  }
}

export default async function EditTemplatePage({ params }) {
  const template = await getTemplateById(params.id);

  if (!template) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Edit Template</h1>
              <p className="text-green-100 text-sm">
                Edit template: {template.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={<div>Loading template data...</div>}>
          <TemplateForm initialTemplate={template} />
        </Suspense>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          Message Template Manager &#169; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
