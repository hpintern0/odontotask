import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [
    totalMeetings,
    pendingReviewMeetings,
    totalTasks,
    pendingTasks,
    approvedTasks,
    publishedTasks,
    discardedTasks,
  ] = await Promise.all([
    prisma.meeting.count(),
    prisma.meeting.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.task.count({ where: { status: "APPROVED" } }),
    prisma.task.count({ where: { status: "PUBLISHED" } }),
    prisma.task.count({ where: { status: "DISCARDED" } }),
  ]);

  // Tasks by responsavel
  const byResponsavel = await prisma.task.groupBy({
    by: ["responsavel"],
    _count: { id: true },
    where: { status: { not: "DISCARDED" } },
  });

  // Tasks by prioridade
  const byPrioridade = await prisma.task.groupBy({
    by: ["prioridade"],
    _count: { id: true },
    where: { status: { not: "DISCARDED" } },
  });

  return NextResponse.json({
    success: true,
    data: {
      meetings: {
        total: totalMeetings,
        pendingReview: pendingReviewMeetings,
      },
      tasks: {
        total: totalTasks,
        pendingReview: pendingTasks,
        approved: approvedTasks,
        published: publishedTasks,
        discarded: discardedTasks,
      },
      byResponsavel: byResponsavel.map((r) => ({
        responsavel: r.responsavel,
        count: r._count.id,
      })),
      byPrioridade: byPrioridade.map((p) => ({
        prioridade: p.prioridade,
        count: p._count.id,
      })),
    },
  });
}
