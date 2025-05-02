// src/app/api/schedules/route.js
import prisma from "@/lib/prisma";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(3),
  templateId: z.number().int(),
  scheduleType: z.enum(["once", "recurring"]),
  cronExpression: z.string().optional(), // only for recurring
  scheduledDate: z.string().datetime().optional(), // only for once
  sessionName: z.string(),
  recipients: z.array(z.string().min(10)),
  parameters: z.record(z.string(), z.string()).optional(),
});

export async function POST(req) {
  try {
    const data = Body.parse(await req.json());

    const schedule = await prisma.schedule.create({
      data: {
        name: data.name,
        templateId: data.templateId,
        scheduleType: data.scheduleType,
        cronExpression:
          data.scheduleType === "recurring" ? data.cronExpression : null,
        scheduledDate:
          data.scheduleType === "once" ? new Date(data.scheduledDate) : null,
        sessionName: data.sessionName,
        recipients: {
          createMany: { data: data.recipients.map((r) => ({ recipient: r })) },
        },
        parameters: {
          createMany: {
            data: Object.entries(data.parameters ?? {}).map(
              ([paramId, paramValue]) => ({ paramId, paramValue })
            ),
          },
        },
      },
      include: { recipients: true, parameters: true },
    });

    return Response.json(schedule, { status: 201 });
  } catch (err) {
    console.error("Schedule‑create failed:", err);
    return Response.json({ message: err.message }, { status: 500 });
  }
}
