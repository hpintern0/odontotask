import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import type { ExtractedTask, Confianca, Prioridade, Responsavel } from "@/packages/types";

const SYSTEM_PROMPT = `Você é um especialista em gestão de projetos de marketing odontológico.
Sua função é analisar transcrições de reuniões e extrair ABSOLUTAMENTE TODAS as tarefas,
demandas, ações, pendências e compromissos mencionados.

REGRAS OBRIGATÓRIAS:
1. NUNCA ignore uma tarefa, mesmo que pareça pequena ou óbvia
2. Se alguém disse "vou fazer X", "precisamos de Y", "lembra de Z", "manda o W",
   "agenda", "cria", "edita", "revisa", "publica", "liga", "envia" — É UMA TAREFA
3. Deduza o responsável com base no contexto e no cargo mencionado
4. Se o prazo não for mencionado, marque como "A definir" mas ainda crie a tarefa
5. Se o cliente não for mencionado explicitamente, use o contexto da reunião
6. Prefira criar 10 tarefas a mais do que esquecer 1 tarefa

CARGOS DISPONÍVEIS PARA ATRIBUIÇÃO:
- estrategista
- gestor_de_projeto
- editor_de_video
- gestor_de_trafego
- comercial
- design

Para cada tarefa extraída, retorne um JSON com:
{
  "titulo": "título claro e objetivo da tarefa",
  "descricao": "descrição detalhada com contexto da reunião",
  "responsavel": "um dos cargos listados acima",
  "prazo": "data no formato YYYY-MM-DD ou 'A definir'",
  "cliente": "nome do cliente odontológico ou 'Interno'",
  "prioridade": "alta | media | baixa",
  "trecho_reuniao": "trecho exato da transcrição que originou essa tarefa",
  "confianca": "alta | media | baixa (confiança na interpretação)"
}

Retorne APENAS um array JSON válido. Sem texto antes ou depois.`;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
  return new Anthropic({ apiKey });
}

async function callClaude(prompt: string): Promise<ExtractedTask[]> {
  const client = getClient();

  const message = await withRetry(
    () =>
      client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    { label: "Claude TaskExtractor", maxRetries: 2, baseDelay: 2000 }
  );

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  try {
    return JSON.parse(text) as ExtractedTask[];
  } catch {
    console.error("[TaskExtractor] Erro ao parsear resposta da IA:", text.slice(0, 200));
    throw new Error("Failed to parse AI response as JSON");
  }
}

function deduplicateTasks(tasks: ExtractedTask[]): ExtractedTask[] {
  const unique: ExtractedTask[] = [];

  for (const task of tasks) {
    const isDuplicate = unique.some(
      (existing) =>
        existing.responsavel === task.responsavel &&
        similarity(existing.titulo, task.titulo) > 0.85
    );
    if (!isDuplicate) {
      unique.push(task);
    } else {
      console.log(`[TaskExtractor] Tarefa duplicada removida: "${task.titulo}"`);
    }
  }

  return unique;
}

function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower === bLower) return 1;

  const aWords = aLower.split(/\s+/);
  const bWords = bLower.split(/\s+/);
  const bSet = new Set(bWords);
  const intersection = aWords.filter((w) => bSet.has(w));
  const unionSet = new Set(aWords.concat(bWords));

  return intersection.length / unionSet.size;
}

export async function extractTasks(meetingId: string) {
  const meeting = await prisma.meeting.findUniqueOrThrow({
    where: { id: meetingId },
  });

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: "PROCESSING" },
  });

  const transcript = meeting.transcriptRaw;
  let allTasks: ExtractedTask[] = [];

  // --- PASSAGEM 1: Extração Explícita ---
  console.log(`[TaskExtractor] Passagem 1 — Extração explícita de tarefas...`);
  const pass1Prompt = `PASSAGEM 1 - EXTRAÇÃO EXPLÍCITA:
Analise a transcrição abaixo e extraia TODAS as tarefas que foram mencionadas EXPLICITAMENTE.
Foque em: ações diretas, pedidos, comandos, compromissos verbais.

TRANSCRIÇÃO:
${transcript}`;

  const pass1Tasks = await callClaude(pass1Prompt);
  allTasks.push(...pass1Tasks);
  console.log(`[TaskExtractor] Passagem 1 concluída — ${pass1Tasks.length} tarefas encontradas`);

  // --- PASSAGEM 2: Extração Implícita ---
  console.log(`[TaskExtractor] Passagem 2 — Extração implícita de tarefas...`);
  const pass2Prompt = `PASSAGEM 2 - EXTRAÇÃO IMPLÍCITA:
Analise a transcrição abaixo e extraia tarefas IMPLÍCITAS — coisas que não foram ditas como ordem direta, mas que são necessárias com base no contexto.
Exemplo: se alguém disse "o conteúdo do Instagram tá fraco", a tarefa implícita é "Revisar e melhorar estratégia de conteúdo do Instagram".

Tarefas já extraídas na passagem anterior (NÃO repita):
${JSON.stringify(pass1Tasks.map((t) => t.titulo))}

TRANSCRIÇÃO:
${transcript}`;

  const pass2Tasks = await callClaude(pass2Prompt);
  allTasks.push(...pass2Tasks);
  console.log(`[TaskExtractor] Passagem 2 concluída — ${pass2Tasks.length} tarefas novas (${allTasks.length} total)`);

  // --- PASSAGEM 3: Verificação Final ---
  console.log(`[TaskExtractor] Passagem 3 — Verificação e consolidação final...`);
  const pass3Prompt = `PASSAGEM 3 - VERIFICAÇÃO FINAL:
Releia a transcrição INTEIRA com olhar crítico. Verifique se alguma tarefa, ação, compromisso ou pendência NÃO foi capturada nas passagens anteriores.

Tarefas já extraídas (NÃO repita estas):
${JSON.stringify(allTasks.map((t) => t.titulo))}

Se encontrar novas tarefas, retorne-as. Se não houver novas, retorne um array vazio [].

TRANSCRIÇÃO:
${transcript}`;

  const pass3Tasks = await callClaude(pass3Prompt);
  allTasks.push(...pass3Tasks);
  console.log(`[TaskExtractor] Passagem 3 concluída — ${pass3Tasks.length} tarefas novas (${allTasks.length} total)`);

  // --- Deduplicação ---
  const dedupedTasks = deduplicateTasks(allTasks);
  console.log(`[TaskExtractor] Após deduplicação: ${dedupedTasks.length} tarefas únicas`);

  // --- Salvar no banco ---
  const savedTasks = await Promise.all(
    dedupedTasks.map((task) =>
      prisma.task.create({
        data: {
          meetingId,
          titulo: task.titulo,
          descricao: task.descricao,
          responsavel: task.responsavel as Responsavel,
          prazo: task.prazo !== "A definir" ? new Date(task.prazo) : null,
          prazoBruto: task.prazo,
          cliente: task.cliente,
          prioridade: task.prioridade as Prioridade,
          trechoReuniao: task.trecho_reuniao,
          confiancaIA: task.confianca as Confianca,
          status: "PENDING_REVIEW",
        },
      })
    )
  );

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      status: "PENDING_REVIEW",
      processedAt: new Date(),
    },
  });

  console.log(`[TaskExtractor] Processamento concluído. ${savedTasks.length} tarefas salvas para revisão.`);
  return savedTasks;
}
