import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskIds, action, edits } = body as {
      taskIds: string[];
      action: "approve" | "discard";
      edits?: Record<string, Record<string, unknown>>;
    };

    if (!taskIds?.length || !action) {
      return NextResponse.json(
        { success: false, error: "taskIds e action são obrigatórios" },
        { status: 400 }
      );
    }

    const results = [];

    for (const taskId of taskIds) {
      const updateData: Record<string, unknown> = {
        status: action === "approve" ? "APPROVED" : "DISCARDED",
      };

      if (action === "approve") {
        updateData.approvedAt = new Date();
      }

      // Apply individual edits if provided
      if (edits?.[taskId]) {
        const taskEdits = edits[taskId];
        if (taskEdits.titulo) updateData.titulo = taskEdits.titulo;
        if (taskEdits.descricao) updateData.descricao = taskEdits.descricao;
        if (taskEdits.responsavel) updateData.responsavel = taskEdits.responsavel;
        if (taskEdits.cliente) updateData.cliente = taskEdits.cliente;
        if (taskEdits.prioridade) updateData.prioridade = taskEdits.prioridade;
        if (taskEdits.supervisorNotes) updateData.supervisorNotes = taskEdits.supervisorNotes;
        if (taskEdits.prazo) {
          updateData.prazo = new Date(taskEdits.prazo as string);
          updateData.prazoBruto = taskEdits.prazo;
        }
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
      });
      results.push(task);
    }

    // Update meeting status
    if (results.length > 0) {
      const meetingId = results[0].meetingId;
      const allTasks = await prisma.task.findMany({ where: { meetingId } });
      const pendingCount = allTasks.filter((t) => t.status === "PENDING_REVIEW").length;
      const approvedCount = allTasks.filter((t) => t.status === "APPROVED").length;

      let meetingStatus: "PENDING_REVIEW" | "PARTIALLY_APPROVED" | "APPROVED" = "PENDING_REVIEW";
      if (pendingCount === 0 && approvedCount > 0) meetingStatus = "APPROVED";
      else if (approvedCount > 0) meetingStatus = "PARTIALLY_APPROVED";

      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: meetingStatus },
      });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("[TaskApprove] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
