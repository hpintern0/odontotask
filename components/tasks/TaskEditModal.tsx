"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RESPONSAVEL_LABELS } from "@/packages/types";
import type { Task } from "@/packages/types";

interface TaskEditModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Record<string, unknown>) => void;
}

export function TaskEditModal({ task, open, onClose, onSave }: TaskEditModalProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [prazo, setPrazo] = useState("");
  const [cliente, setCliente] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [supervisorNotes, setSupervisorNotes] = useState("");

  // Sync state when task changes
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);
  if (task && task.id !== lastTaskId) {
    setLastTaskId(task.id);
    setTitulo(task.titulo);
    setDescricao(task.descricao);
    setResponsavel(task.responsavel);
    setPrazo(task.prazo ? new Date(task.prazo).toISOString().split("T")[0] : "");
    setCliente(task.cliente);
    setPrioridade(task.prioridade);
    setSupervisorNotes(task.supervisorNotes || "");
  }

  function handleSave() {
    if (!task) return;
    onSave(task.id, {
      titulo,
      descricao,
      responsavel,
      prazo: prazo || undefined,
      cliente,
      prioridade,
      supervisorNotes: supervisorNotes || undefined,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Título</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Descrição</label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Responsável</label>
              <Select value={responsavel} onValueChange={setResponsavel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESPONSAVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Prioridade</label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Prazo</label>
              <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cliente</label>
              <Input value={cliente} onChange={(e) => setCliente(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Observação do Supervisor</label>
            <Textarea
              value={supervisorNotes}
              onChange={(e) => setSupervisorNotes(e.target.value)}
              rows={2}
              placeholder="Adicione uma nota opcional..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
