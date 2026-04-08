"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskEditModal } from "@/components/tasks/TaskEditModal";
import { ArrowLeft, CheckCheck, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Meeting, Task } from "@/packages/types";
import { RESPONSAVEL_LABELS, RESPONSAVEL_COLORS } from "@/packages/types";
import { cn } from "@/lib/utils";

interface MeetingWithTasks extends Meeting {
  tasks: Task[];
}

export default function MeetingReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [meeting, setMeeting] = useState<MeetingWithTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [showPublishPreview, setShowPublishPreview] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadMeeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadMeeting() {
    try {
      const res = await fetch(`/api/meetings/${id}`);
      const data = await res.json();
      if (data.success) setMeeting(data.data);
      else toast.error("Reunião não encontrada");
    } catch {
      toast.error("Erro ao carregar reunião");
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(taskId: string, checked: boolean) {
    const next = new Set(selectedTasks);
    if (checked) next.add(taskId);
    else next.delete(taskId);
    setSelectedTasks(next);
  }

  function selectAllPending() {
    if (!meeting) return;
    const pending = meeting.tasks
      .filter((t) => t.status === "PENDING_REVIEW")
      .map((t) => t.id);
    setSelectedTasks(new Set(pending));
  }

  async function handleApprove(taskId: string) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/tasks/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: [taskId], action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tarefa aprovada!");
        loadMeeting();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Erro ao aprovar tarefa");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDiscard(taskId: string) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/tasks/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: [taskId], action: "discard" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tarefa descartada");
        loadMeeting();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Erro ao descartar tarefa");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkApprove() {
    if (selectedTasks.size === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/tasks/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: Array.from(selectedTasks), action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${selectedTasks.size} tarefas aprovadas!`);
        setSelectedTasks(new Set());
        loadMeeting();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Erro ao aprovar tarefas");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEditSave(taskId: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tarefa atualizada!");
        loadMeeting();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Erro ao atualizar tarefa");
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await fetch("/api/tasks/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: id }),
      });
      const data = await res.json();
      if (data.success) {
        const { summary } = data.data;
        if (summary.failed > 0) {
          toast.warning(`${summary.published} publicadas, ${summary.failed} falharam`);
        } else {
          toast.success(`${summary.published} tarefas publicadas no Notion!`);
        }
        setShowPublishPreview(false);
        loadMeeting();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Erro ao publicar no Notion");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Reunião não encontrada</p>
        <Link href="/meetings">
          <Button variant="link">Voltar para reuniões</Button>
        </Link>
      </div>
    );
  }

  const pendingTasks = meeting.tasks.filter((t) => t.status === "PENDING_REVIEW");
  const approvedTasks = meeting.tasks.filter((t) => t.status === "APPROVED");
  const discardedTasks = meeting.tasks.filter((t) => t.status === "DISCARDED");
  const publishedTasks = meeting.tasks.filter((t) => t.status === "PUBLISHED");

  // Group by responsavel for summary
  const byResponsavel: Record<string, number> = {};
  meeting.tasks.forEach((t) => {
    byResponsavel[t.responsavel] = (byResponsavel[t.responsavel] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/meetings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
          <p className="text-gray-500">
            {new Date(meeting.date).toLocaleDateString("pt-BR")} — {meeting.participants.join(", ")}
          </p>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <span className="text-sm text-gray-500">Total de tarefas</span>
              <p className="text-2xl font-bold">{meeting.tasks.length}</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div>
              <span className="text-sm text-gray-500">Pendentes</span>
              <p className="text-2xl font-bold text-orange-600">{pendingTasks.length}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Aprovadas</span>
              <p className="text-2xl font-bold text-green-600">{approvedTasks.length}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Descartadas</span>
              <p className="text-2xl font-bold text-red-600">{discardedTasks.length}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Publicadas</span>
              <p className="text-2xl font-bold text-blue-600">{publishedTasks.length}</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="flex flex-wrap gap-2 items-center">
              {Object.entries(byResponsavel).map(([resp, count]) => {
                const colors = RESPONSAVEL_COLORS[resp] || { bg: "bg-gray-100", text: "text-gray-700" };
                return (
                  <Badge key={resp} className={cn(colors.bg, colors.text, "border-0")}>
                    {RESPONSAVEL_LABELS[resp] || resp}: {count}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {pendingTasks.length > 0 && (
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={selectAllPending}>
            Selecionar todas pendentes ({pendingTasks.length})
          </Button>
          {selectedTasks.size > 0 && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleBulkApprove} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCheck className="h-4 w-4 mr-1" />}
              Aprovar selecionadas ({selectedTasks.size})
            </Button>
          )}
        </div>
      )}

      {/* Publish Button */}
      {approvedTasks.length > 0 && (
        <Button
          onClick={() => setShowPublishPreview(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Send className="h-4 w-4 mr-2" />
          Enviar {approvedTasks.length} tarefa(s) para o Notion
        </Button>
      )}

      {/* Tasks */}
      <div className="space-y-4">
        {pendingTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Pendentes de Revisão</h2>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={selectedTasks.has(task.id)}
                  onSelect={handleSelect}
                  onApprove={handleApprove}
                  onDiscard={handleDiscard}
                  onEdit={setEditingTask}
                />
              ))}
            </div>
          </div>
        )}

        {approvedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-green-700 mb-3">Aprovadas</h2>
            <div className="space-y-3">
              {approvedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={false}
                  onSelect={() => {}}
                  onApprove={() => {}}
                  onDiscard={() => {}}
                  onEdit={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {publishedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-blue-700 mb-3">Publicadas no Notion</h2>
            <div className="space-y-3">
              {publishedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={false}
                  onSelect={() => {}}
                  onApprove={() => {}}
                  onDiscard={() => {}}
                  onEdit={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {discardedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-red-700 mb-3">Descartadas</h2>
            <div className="space-y-3">
              {discardedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={false}
                  onSelect={() => {}}
                  onApprove={() => {}}
                  onDiscard={() => {}}
                  onEdit={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <TaskEditModal
        task={editingTask}
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleEditSave}
      />

      {/* Publish Preview Dialog */}
      <Dialog open={showPublishPreview} onOpenChange={setShowPublishPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Envio ao Notion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            As seguintes {approvedTasks.length} tarefas serão criadas no Notion:
          </p>
          <div className="space-y-2 mt-4">
            {approvedTasks.map((task) => {
              const colors = RESPONSAVEL_COLORS[task.responsavel] || { bg: "bg-gray-100", text: "text-gray-700" };
              return (
                <div key={task.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <p className="font-medium text-sm">{task.titulo}</p>
                    <p className="text-xs text-gray-500">{task.cliente}</p>
                  </div>
                  <Badge className={cn(colors.bg, colors.text, "border-0")}>
                    {RESPONSAVEL_LABELS[task.responsavel] || task.responsavel}
                  </Badge>
                </div>
              );
            })}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowPublishPreview(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handlePublish} disabled={publishing}>
              {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Confirmar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
