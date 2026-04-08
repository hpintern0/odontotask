import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const meetingId = searchParams.get("meetingId");
  const status = searchParams.get("status");
  const responsavel = searchParams.get("responsavel");

  const where: Record<string, unknown> = {};
  if (meetingId) where.meetingId = meetingId;
  if (status) where.status = status;
  if (responsavel) where.responsavel = responsavel;

  const tasks = await prisma.task.findMany({
    where,
    include: { meeting: { select: { title: true, date: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ success: true, data: tasks });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, ...updates } = body as { taskId: string; [key: string]: unknown };

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "taskId é obrigatório" },
        { status: 400 }
      );
    }

    if (updates.prazo && typeof updates.prazo === "string") {
      updates.prazo = new Date(updates.prazo);
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updates,
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("[TaskUpdate] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
