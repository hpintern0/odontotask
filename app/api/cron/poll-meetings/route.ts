import { NextRequest, NextResponse } from "next/server";
import { pollNewMeetings } from "@/packages/agents/transcription-fetcher";
import { extractTasks } from "@/packages/agents/task-extractor";
import { prisma } from "@/lib/prisma";

/**
 * Endpoint de polling para buscar novas reuniões do TLDV.
 * Pode ser chamado via cron job do Railway ou externamente.
 *
 * Railway Cron: configure para chamar GET /api/cron/poll-meetings a cada 30 min
 */
export async function GET(req: NextRequest) {
  // Optional: protect with a secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[CronPoll] Iniciando polling de reuniões - ${new Date().toISOString()}`);

  try {
    await pollNewMeetings();

    // Process any pending meetings
    const pendingMeetings = await prisma.meeting.findMany({
      where: { status: "PENDING" },
    });

    for (const meeting of pendingMeetings) {
      console.log(`[CronPoll] Processando reunião pendente: ${meeting.title}`);
      try {
        await extractTasks(meeting.id);
      } catch (error) {
        console.error(`[CronPoll] Erro ao processar reunião ${meeting.id}:`, error);
      }
    }

    const processedCount = pendingMeetings.length;
    console.log(`[CronPoll] Polling concluído. ${processedCount} reuniões processadas.`);

    return NextResponse.json({
      success: true,
      data: {
        processedMeetings: processedCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`[CronPoll] Erro no polling:`, error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
