// app/api/templates/[id]/route.js
import {
  getTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/templates/templateUtils";

export async function GET(_, { params }) {
  const id = params?.id; // Access using optional chaining
  const template = await getTemplate(id);
  return Response.json(template);
}

export async function PUT(req, { params }) {
  const body = await req.json();
  const result = await updateTemplate(params.id, body);
  return Response.json(result);
}

export async function DELETE(_, { params }) {
  try {
    const id = parseInt(params?.id, 10);

    if (isNaN(id)) {
      return Response.json({ error: "Invalid template ID" }, { status: 400 });
    }

    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    // Check for dependent schedules
    const dependentSchedules = await prisma.schedule.findMany({
      where: { templateId: id },
      select: { id: true, name: true, status: true },
    });

    // Delete template and all associated schedules in a transaction
    await prisma.$transaction(async (tx) => {
      // First delete all associated schedule data
      await tx.scheduleParameter.deleteMany({
        where: {
          scheduleId: {
            in: dependentSchedules.map((s) => s.id),
          },
        },
      });

      await tx.scheduleRecipient.deleteMany({
        where: {
          scheduleId: {
            in: dependentSchedules.map((s) => s.id),
          },
        },
      });

      await tx.scheduleHistory.deleteMany({
        where: {
          scheduleId: {
            in: dependentSchedules.map((s) => s.id),
          },
        },
      });

      // Then delete schedules
      await tx.schedule.deleteMany({
        where: { templateId: id },
      });

      // Finally delete template parameters and the template itself
      await tx.parameter.deleteMany({
        where: { templateId: id },
      });

      await tx.template.delete({
        where: { id },
      });
    });

    return Response.json({
      success: true,
      deletedSchedules: dependentSchedules.length,
    });
  } catch (error) {
    console.error(`Error deleting template:`, error);
    return Response.json(
      { error: "Failed to delete template", details: error.message },
      { status: 500 }
    );
  }
}
