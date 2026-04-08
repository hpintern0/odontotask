import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import type { TldvMeeting, TldvTranscript } from "@/packages/types";

const TLDV_BASE_URL = "https://api.tldv.io/v1alpha1";

async function tldvFetch<T>(path: string): Promise<T> {
  return withRetry(
    async () => {
      const apiKey = process.env.TLDV_API_KEY;
      if (!apiKey) throw new Error("TLDV_API_KEY not configured");

      const res = await fetch(`${TLDV_BASE_URL}${path}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`TLDV API error: ${res.status} ${res.statusText}`);
      }

      return res.json() as Promise<T>;
    },
    { label: `TLDV ${path}`, maxRetries: 3 }
  );
}

export async function fetchMeetings(): Promise<TldvMeeting[]> {
  console.log(`[TranscriptionFetcher] Buscando reuniões do TLDV...`);
  const data = await tldvFetch<{ results: TldvMeeting[] }>("/meetings");
  console.log(`[TranscriptionFetcher] ${data.results.length} reuniões encontradas`);
  return data.results;
}

export async function fetchTranscript(meetingId: string): Promise<string> {
  console.log(`[TranscriptionFetcher] Buscando transcrição da reunião ${meetingId}...`);
  const data = await tldvFetch<TldvTranscript>(`/meetings/${meetingId}/transcript`);

  const fullText = data.segments
    .map((s) => `[${s.speaker}]: ${s.text}`)
    .join("\n");

  console.log(`[TranscriptionFetcher] Transcrição obtida: ${fullText.length} caracteres`);
  return fullText;
}

export async function fetchAndStoreMeeting(tldvMeetingId: string) {
  const existing = await prisma.meeting.findUnique({
    where: { tldvId: tldvMeetingId },
  });

  if (existing) {
    console.log(`[TranscriptionFetcher] Reunião ${tldvMeetingId} já processada, pulando.`);
    return existing;
  }

  const meetingData = await tldvFetch<TldvMeeting>(`/meetings/${tldvMeetingId}`);
  const transcript = await fetchTranscript(tldvMeetingId);

  const meeting = await prisma.meeting.create({
    data: {
      tldvId: tldvMeetingId,
      title: meetingData.title,
      date: new Date(meetingData.started_at),
      participants: meetingData.participants.map((p) => p.name),
      transcriptRaw: transcript,
      tldvUrl: meetingData.url,
      status: "PENDING",
    },
  });

  console.log(`[TranscriptionFetcher] Reunião ${meeting.id} salva com sucesso.`);
  return meeting;
}

export async function pollNewMeetings() {
  console.log(`[TranscriptionFetcher] Iniciando polling de novas reuniões...`);
  const timestamp = new Date().toISOString();

  try {
    const meetings = await fetchMeetings();

    for (const meeting of meetings) {
      const exists = await prisma.meeting.findUnique({
        where: { tldvId: meeting.id },
      });

      if (!exists) {
        console.log(`[TranscriptionFetcher] Nova reunião encontrada: ${meeting.title}`);
        await fetchAndStoreMeeting(meeting.id);
      }
    }

    console.log(`[TranscriptionFetcher] Polling concluído em ${timestamp}`);
  } catch (error) {
    console.error(`[TranscriptionFetcher] Erro no polling:`, error);
    throw error;
  }
}
