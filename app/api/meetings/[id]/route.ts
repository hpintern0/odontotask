import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
  });

  if (!meeting) {
    return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: meeting });
}
