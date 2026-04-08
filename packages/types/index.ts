// ===== Enums (duplicated from Prisma for client-side safety) =====
// These mirror the Prisma enums but are safe to import in client components

export const MeetingStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  PENDING_REVIEW: "PENDING_REVIEW",
  PARTIALLY_APPROVED: "PARTIALLY_APPROVED",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
} as const;
export type MeetingStatus = (typeof MeetingStatus)[keyof typeof MeetingStatus];

export const TaskStatus = {
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  DISCARDED: "DISCARDED",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const Responsavel = {
  estrategista: "estrategista",
  gestor_de_projeto: "gestor_de_projeto",
  editor_de_video: "editor_de_video",
  gestor_de_trafego: "gestor_de_trafego",
  comercial: "comercial",
  design: "design",
} as const;
export type Responsavel = (typeof Responsavel)[keyof typeof Responsavel];

export const Prioridade = {
  alta: "alta",
  media: "media",
  baixa: "baixa",
} as const;
export type Prioridade = (typeof Prioridade)[keyof typeof Prioridade];

export const Confianca = {
  alta: "alta",
  media: "media",
  baixa: "baixa",
} as const;
export type Confianca = (typeof Confianca)[keyof typeof Confianca];

// ===== Plain TS types mirroring Prisma models =====
export interface Meeting {
  id: string;
  tldvId: string;
  title: string;
  date: string | Date;
  participants: string[];
  transcriptRaw: string;
  tldvUrl: string | null;
  status: MeetingStatus;
  processedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Task {
  id: string;
  meetingId: string;
  titulo: string;
  descricao: string;
  responsavel: Responsavel;
  prazo: string | Date | null;
  prazoBruto: string | null;
  cliente: string;
  prioridade: Prioridade;
  status: TaskStatus;
  trechoReuniao: string;
  confiancaIA: Confianca;
  notionPageId: string | null;
  notionUrl: string | null;
  supervisorNotes: string | null;
  approvedAt: string | Date | null;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Client {
  id: string;
  name: string;
  aliases: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ===== TLDV API types =====
export interface TldvMeeting {
  id: string;
  title: string;
  started_at: string;
  ended_at: string;
  duration: number;
  url: string;
  participants: TldvParticipant[];
}

export interface TldvParticipant {
  name: string;
  email?: string;
}

export interface TldvTranscript {
  meeting_id: string;
  segments: TldvTranscriptSegment[];
}

export interface TldvTranscriptSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

// ===== Task extraction types =====
export interface ExtractedTask {
  titulo: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  cliente: string;
  prioridade: "alta" | "media" | "baixa";
  trecho_reuniao: string;
  confianca: "alta" | "media" | "baixa";
}

// ===== API response types =====
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== UI constants =====
export const RESPONSAVEL_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  estrategista:      { bg: "bg-purple-100", text: "text-purple-700", hex: "#7C3AED" },
  gestor_de_projeto: { bg: "bg-blue-100",   text: "text-blue-700",   hex: "#2563EB" },
  editor_de_video:   { bg: "bg-orange-100", text: "text-orange-700", hex: "#EA580C" },
  gestor_de_trafego: { bg: "bg-green-100",  text: "text-green-700",  hex: "#16A34A" },
  comercial:         { bg: "bg-pink-100",   text: "text-pink-700",   hex: "#DB2777" },
  design:            { bg: "bg-cyan-100",   text: "text-cyan-700",   hex: "#0891B2" },
};

export const RESPONSAVEL_LABELS: Record<string, string> = {
  estrategista:      "Estrategista",
  gestor_de_projeto: "Gestor de Projeto",
  editor_de_video:   "Editor de Vídeo",
  gestor_de_trafego: "Gestor de Tráfego",
  comercial:         "Comercial",
  design:            "Design",
};

export const CONFIANCA_COLORS: Record<string, { bg: string; text: string }> = {
  alta:  { bg: "bg-green-100",  text: "text-green-700" },
  media: { bg: "bg-yellow-100", text: "text-yellow-700" },
  baixa: { bg: "bg-red-100",    text: "text-red-700" },
};

export const TASK_STATUS_STYLES: Record<string, { bg: string; border: string; text?: string }> = {
  PENDING_REVIEW: { bg: "bg-gray-50",   border: "border-gray-300" },
  APPROVED:       { bg: "bg-green-50",  border: "border-green-400" },
  DISCARDED:      { bg: "bg-red-50",    border: "border-red-400", text: "line-through" },
  PUBLISHED:      { bg: "bg-blue-50",   border: "border-blue-400" },
  FAILED:         { bg: "bg-red-50",    border: "border-red-600" },
};
