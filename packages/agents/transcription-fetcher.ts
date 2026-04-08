import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import type { TldvMeeting } from "@/packages/types";

const TLDV_BASE_URL = "https://pasta.tldv.io/v1alpha1";

interface TldvApiMeeting {
  id: string;
  name: string;
  happenedAt: string;
  duration: number;
  url: string;
  invitees: { name?: string; email?: string }[];
  organizer: { name: string; email: string };
}

interface TldvTranscriptResponse {
  id: string;
  meetingId: string;
  data: { startTime: number; endTime: number; speaker: string; text: string }[];
}

async function tldvFetch<T>(path: string): Promise<T> {
  return withRetry(
    async () => {
      const apiKey = process.env.TLDV_API_KEY;
      if (!apiKey) throw new Error("TLDV_API_KEY not configured");

      const res = await fetch(`${TLDV_BASE_URL}${path}`, {
        headers: {
          "x-api-key": apiKey,
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

export async function fetchMeetings(): Promise<TldvApiMeeting[]> {
  console.log(`[TranscriptionFetcher] Buscando reuniões do TLDV...`);
  const data = await tldvFetch<{ results: TldvApiMeeting[] }>("/meetings?limit=20");
  console.log(`[TranscriptionFetcher] ${data.results.length} reuniões encontradas`);
  return data.results;
}

export async function fetchTranscript(meetingId: string): Promise<string> {
  console.log(`[TranscriptionFetcher] Buscando transcrição da reunião ${meetingId}...`);
  const data = await tldvFetch<TldvTranscriptResponse>(`/meetings/${meetingId}/transcript`);

  const fullText = data.data
    .map((s) => `[${s.speaker}]: ${s.text}`)
    .join("\n");

  console.log(`[TranscriptionFetcher] Transcrição obtida: ${fullText.length} caracteres, ${data.data.length} segmentos`);
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

  const meetingData = await tldvFetch<TldvApiMeeting>(`/meetings/${tldvMeetingId}`);
  const transcript = await fetchTranscript(tldvMeetingId);

  // Build participants list from organizer + invitees
  const participants = [meetingData.organizer.name];
  for (const inv of meetingData.invitees) {
    if (inv.name) participants.push(inv.name);
  }

  const meeting = await prisma.meeting.create({
    data: {
      tldvId: tldvMeetingId,
      title: meetingData.name,
      date: new Date(meetingData.happenedAt),
      participants,
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
        console.log(`[TranscriptionFetcher] Nova reunião encontrada: ${meeting.name}`);
        await fetchAndStoreMeeting(meeting.id);
      }
    }

    console.log(`[TranscriptionFetcher] Polling concluído em ${timestamp}`);
  } catch (error) {
    console.error(`[TranscriptionFetcher] Erro no polling:`, error);
    throw error;
  }
}
