import prisma from "@/lib/db/prisma";

export async function listSchedules() {
  return await prisma.schedule.findMany({
    include: {
      template: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function getSchedule(id) {
  return await prisma.schedule.findUnique({
    where: { id: Number(id) },
    include: {
      template: true,
    },
  });
}

export async function updateSchedule(id, data) {
  return await prisma.schedule.update({
    where: { id: Number(id) },
    data,
  });
}

export async function deleteSchedule(id) {
  return await prisma.schedule.delete({
    where: { id: Number(id) },
  });
}
