# OdontoTask

Sistema de gestao de tarefas para assessoria de marketing odontologico. Capta transcricoes de reunioes via TLDV, extrai tarefas com IA (Claude) e envia para o Notion.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **IA:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Banco:** PostgreSQL com Prisma ORM
- **Integracoes:** TLDV API + Notion API
- **Deploy:** Railway

## Fluxo

1. Reuniao gravada no TLDV
2. Sistema busca transcricao (webhook ou polling)
3. IA extrai TODAS as tarefas em 3 passagens
4. Supervisor revisa, edita e aprova tarefas no dashboard
5. Tarefas aprovadas sao publicadas no Notion

## Deploy no Railway

### 1. Criar projeto no Railway

- Crie um novo projeto no Railway
- Adicione um servico PostgreSQL
- Conecte este repositorio como servico

### 2. Variaveis de ambiente

Configure no painel do Railway:

```
ANTHROPIC_API_KEY=sk-ant-...
TLDV_API_KEY=...
TLDV_WEBHOOK_SECRET=...
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...
DATABASE_URL=(fornecido automaticamente pelo Railway PostgreSQL)
NEXTAUTH_SECRET=(gere com: openssl rand -base64 32)
NEXTAUTH_URL=https://seu-app.railway.app
NEXT_PUBLIC_APP_URL=https://seu-app.railway.app
TLDV_POLLING_INTERVAL=30
```

### 3. Deploy

O Railway detecta automaticamente o `railway.json` e executa:

- **Build:** `npx prisma generate && npm run build`
- **Start:** `npm start`

### 4. Migrar banco de dados

Apos o primeiro deploy, execute no Railway CLI:

```bash
railway run npx prisma migrate dev --name init
```

## Desenvolvimento local

### Pre-requisitos

- Node.js 18+
- Docker (para PostgreSQL local)

### Setup

```bash
# Instalar dependencias
npm install

# Subir PostgreSQL local
docker-compose up -d

# Copiar variaveis de ambiente
cp .env.example .env
# Editar .env com suas chaves

# Gerar Prisma Client
npx prisma generate

# Rodar migracoes
npx prisma migrate dev --name init

# Iniciar dev server
npm run dev
```

Abra http://localhost:3000

## Configuracao do Notion

Crie um database no Notion com as seguintes propriedades:

| Propriedade | Tipo |
|---|---|
| Nome da Tarefa | Title |
| Responsavel | Select (Estrategista, Gestor de Projeto, Editor de Video, Gestor de Trafego, Comercial, Design) |
| Prazo | Date |
| Cliente | Select |
| Descricao | Rich text |
| Prioridade | Select (Alta, Media, Baixa) |
| Status | Status (A Fazer, Em Andamento, Concluido) |
| Reuniao de Origem | URL |
| Data da Reuniao | Date |
| Confianca IA | Select (Alta, Media, Baixa) |

## Configuracao do TLDV

1. Obtenha sua API key em https://tldv.io
2. Configure o webhook para: `https://seu-app.railway.app/api/webhooks/tldv`

## API Routes

| Metodo | Rota | Descricao |
|---|---|---|
| GET | /api/meetings | Listar reunioes |
| GET | /api/meetings/:id | Detalhes da reuniao |
| GET | /api/meetings/:id/tasks | Tarefas da reuniao |
| POST | /api/fetch-meeting | Buscar reuniao do TLDV |
| GET | /api/tasks | Listar tarefas |
| PATCH | /api/tasks | Atualizar tarefa |
| POST | /api/tasks/approve | Aprovar/descartar tarefas |
| POST | /api/tasks/publish | Publicar no Notion |
| POST | /api/webhooks/tldv | Webhook do TLDV |
| GET | /api/health | Health check |
