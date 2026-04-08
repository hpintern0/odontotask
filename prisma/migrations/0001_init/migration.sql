-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'PROCESSING', 'PENDING_REVIEW', 'PARTIALLY_APPROVED', 'APPROVED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'DISCARDED', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "Responsavel" AS ENUM ('estrategista', 'gestor_de_projeto', 'editor_de_video', 'gestor_de_trafego', 'comercial', 'design');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('alta', 'media', 'baixa');

-- CreateEnum
CREATE TYPE "Confianca" AS ENUM ('alta', 'media', 'baixa');

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "tldvId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "participants" TEXT[],
    "transcriptRaw" TEXT NOT NULL,
    "tldvUrl" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "responsavel" "Responsavel" NOT NULL,
    "prazo" TIMESTAMP(3),
    "prazoBruto" TEXT,
    "cliente" TEXT NOT NULL,
    "prioridade" "Prioridade" NOT NULL DEFAULT 'media',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "trechoReuniao" TEXT NOT NULL,
    "confiancaIA" "Confianca" NOT NULL,
    "notionPageId" TEXT,
    "notionUrl" TEXT,
    "supervisorNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_tldvId_key" ON "Meeting"("tldvId");

-- CreateIndex
CREATE INDEX "Task_meetingId_idx" ON "Task"("meetingId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_responsavel_idx" ON "Task"("responsavel");

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
