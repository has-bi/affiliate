import prisma from "@/lib/db/prisma";

export async function getTemplate(id) {
  return await prisma.template.findUnique({
    where: { id: Number(id) },
    include: { parameters: true },
  });
}

export async function updateTemplate(id, data) {
  return await prisma.template.update({
    where: { id: Number(id) },
    data,
  });
}

export async function listTemplates() {
  return await prisma.template.findMany({
    include: { parameters: true },
  });
}

export function formatMessageContent(content, parameters) {
  if (!content || !parameters) return content;

  let formattedContent = content;
  parameters.forEach((param) => {
    const regex = new RegExp(`\\{${param.id}\\}`, "g");
    formattedContent = formattedContent.replace(regex, param.value || "");
  });

  return formattedContent;
}
