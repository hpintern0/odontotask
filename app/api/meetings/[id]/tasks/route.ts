import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tasks = await prisma.task.findMany({
    where: { meetingId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ success: true, data: tasks });
}
