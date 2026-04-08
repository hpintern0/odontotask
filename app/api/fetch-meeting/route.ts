import { NextRequest, NextResponse } from "next/server";
import { fetchAndStoreMeeting } from "@/packages/agents/transcription-fetcher";
import { extractTasks } from "@/packages/agents/task-extractor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { meetingId, meetingUrl } = body as { meetingId?: string; meetingUrl?: string };

    // Extract ID from URL if provided
    let tldvId = meetingId;
    if (!tldvId && meetingUrl) {
      const match = meetingUrl.match(/meetings\/([a-zA-Z0-9]+)/);
      if (match) tldvId = match[1];
    }

    if (!tldvId) {
      return NextResponse.json(
        { success: false, error: "meetingId ou meetingUrl é obrigatório" },
        { status: 400 }
      );
    }

    // Step 1: Fetch and store meeting
    const meeting = await fetchAndStoreMeeting(tldvId);

    // Step 2: Extract tasks if not yet processed
    if (meeting.status === "PENDING") {
      await extractTasks(meeting.id);
    }

    return NextResponse.json({ success: true, data: { meetingId: meeting.id } });
  } catch (error) {
    console.error("[FetchMeeting] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
