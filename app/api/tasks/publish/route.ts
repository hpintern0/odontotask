import { NextRequest, NextResponse } from "next/server";
import { publishApprovedTasks } from "@/packages/agents/notion-publisher";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { meetingId } = body as { meetingId: string };

    if (!meetingId) {
      return NextResponse.json(
        { success: false, error: "meetingId é obrigatório" },
        { status: 400 }
      );
    }

    const results = await publishApprovedTasks(meetingId);

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          published: successCount,
          failed: failCount,
        },
      },
    });
  } catch (error) {
    console.error("[TaskPublish] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
