import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const cliente = searchParams.get("cliente");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (cliente) {
    where.tasks = { some: { cliente: { contains: cliente, mode: "insensitive" } } };
  }

  const meetings = await prisma.meeting.findMany({
    where,
    include: {
      tasks: { select: { id: true, status: true, responsavel: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ success: true, data: meetings });
}
