import { Client } from "@notionhq/client";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import { RESPONSAVEL_LABELS } from "@/packages/types";
import type { Task } from "@/packages/types";

function getNotionClient(): Client {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error("NOTION_API_KEY not configured");
  return new Client({ auth: apiKey });
}

function getDatabaseId(): string {
  const id = process.env.NOTION_DATABASE_ID;
  if (!id) throw new Error("NOTION_DATABASE_ID not configured");
  return id;
}

export async function publishTaskToNotion(task: Task & { meeting: { tldvUrl: string | null; date: Date } }) {
  const notion = getNotionClient();
  const databaseId = getDatabaseId();

  console.log(`[NotionPublisher] Publicando tarefa "${task.titulo}" no Notion...`);

  // Build properties matching the existing "Tarefas da Equipe" database structure
  const properties: Record<string, unknown> = {
    // Title field (existing)
    "Tarefa": {
      title: [{ text: { content: task.titulo } }],
    },
    // Status field (existing) - map to "Pendente" as default
    "Status": {
      status: { name: "Pendente" },
    },
    // Cargo Responsável (new select field - since Responsável is people type)
    "Cargo Responsável": {
      select: { name: RESPONSAVEL_LABELS[task.responsavel] || task.responsavel },
    },
    // Descrição (new rich_text field)
    "Descrição": {
      rich_text: [{ text: { content: task.descricao.slice(0, 2000) } }],
    },
    // Prioridade (new select field)
    "Prioridade": {
      select: { name: task.prioridade === "alta" ? "Alta" : task.prioridade === "media" ? "Média" : "Baixa" },
    },
    // Confiança IA (new select field)
    "Confiança IA": {
      select: { name: task.confiancaIA === "alta" ? "Alta" : task.confiancaIA === "media" ? "Média" : "Baixa" },
    },
  };

  // Prazo (existing date field)
  if (task.prazo) {
    properties["Prazo"] = {
      date: { start: new Date(task.prazo).toISOString().split("T")[0] },
    };
  }

  // Reunião de Origem (new URL field)
  if (task.meeting.tldvUrl) {
    properties["Reunião de Origem"] = {
      url: task.meeting.tldvUrl,
    };
  }

  // Data da Reunião (new date field)
  properties["Data da Reunião"] = {
    date: { start: new Date(task.meeting.date).toISOString().split("T")[0] },
  };

  try {
    const page = await withRetry(
      () =>
        notion.pages.create({
          parent: { database_id: databaseId },
          properties: properties as Parameters<typeof notion.pages.create>[0]["properties"],
        }),
      { label: `Notion publish "${task.titulo}"`, maxRetries: 3 }
    );

    const notionUrl = `https://www.notion.so/${page.id.replace(/-/g, "")}`;

    await prisma.task.update({
      where: { id: task.id },
      data: {
        notionPageId: page.id,
        notionUrl,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    console.log(`[NotionPublisher] Tarefa "${task.titulo}" publicada com sucesso: ${notionUrl}`);
    return { success: true, notionUrl };
  } catch (error) {
    console.error(`[NotionPublisher] Erro ao publicar "${task.titulo}":`, error);

    await prisma.task.update({
      where: { id: task.id },
      data: { status: "FAILED" },
    });

    return { success: false, error: String(error) };
  }
}

export async function publishApprovedTasks(meetingId: string) {
  const tasks = await prisma.task.findMany({
    where: { meetingId, status: "APPROVED" },
    include: { meeting: { select: { tldvUrl: true, date: true } } },
  });

  console.log(`[NotionPublisher] Publicando ${tasks.length} tarefas aprovadas da reunião ${meetingId}...`);

  const results = [];
  for (const task of tasks) {
    const result = await publishTaskToNotion(task);
    results.push({ taskId: task.id, titulo: task.titulo, ...result });
  }

  // Update meeting status
  const allPublished = results.every((r) => r.success);
  const anyPublished = results.some((r) => r.success);

  if (allPublished) {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "PUBLISHED" },
    });
  } else if (anyPublished) {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "PARTIALLY_APPROVED" },
    });
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;
  console.log(`[NotionPublisher] Concluído: ${successCount} publicadas, ${failCount} falharam.`);

  return results;
}
