// src/app/api/schedules/[id]/route.js
import {
  getSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/lib/schedules/scheduleUtils";

export async function GET(_, { params }) {
  const schedule = await getSchedule(params.id);
  return Response.json(schedule);
}

export async function PUT(req, { params }) {
  const body = await req.json();
  const result = await updateSchedule(params.id, body);
  return Response.json(result);
}

export async function DELETE(_, { params }) {
  const result = await deleteSchedule(params.id);
  return Response.json(result);
}
