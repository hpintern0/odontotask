import { NextRequest, NextResponse } from "next/server";
import { fetchAndStoreMeeting } from "@/packages/agents/transcription-fetcher";
import { extractTasks } from "@/packages/agents/task-extractor";

export async function POST(req: NextRequest) {
  try {
    // Validate webhook secret if configured
    const webhookSecret = process.env.TLDV_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get("x-tldv-signature");
      if (signature !== webhookSecret) {
        console.warn("[WebhookListener] Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = await req.json();
    const meetingId = body?.meeting?.id || body?.meetingId;

    if (!meetingId) {
      console.warn("[WebhookListener] No meeting ID in webhook payload");
      return NextResponse.json({ error: "Missing meeting ID" }, { status: 400 });
    }

    console.log(`[WebhookListener] Webhook recebido para reunião: ${meetingId}`);

    // Respond immediately, process async
    // In production on Railway, this runs in the same process
    // but the response is sent before processing completes
    processWebhookAsync(meetingId).catch((err) =>
      console.error(`[WebhookListener] Erro no processamento assíncrono:`, err)
    );

    return NextResponse.json({ success: true, message: "Processing started" });
  } catch (error) {
    console.error("[WebhookListener] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function processWebhookAsync(tldvMeetingId: string) {
  console.log(`[WebhookListener] Processando reunião ${tldvMeetingId} em background...`);
  const meeting = await fetchAndStoreMeeting(tldvMeetingId);
  if (meeting.status === "PENDING") {
    await extractTasks(meeting.id);
  }
  console.log(`[WebhookListener] Processamento da reunião ${tldvMeetingId} concluído.`);
}
