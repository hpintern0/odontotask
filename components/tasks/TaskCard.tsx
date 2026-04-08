"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Pencil, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  RESPONSAVEL_COLORS,
  RESPONSAVEL_LABELS,
  CONFIANCA_COLORS,
  TASK_STATUS_STYLES,
} from "@/packages/types";
import type { Task } from "@/packages/types";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onApprove: (id: string) => void;
  onDiscard: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, selected, onSelect, onApprove, onDiscard, onEdit }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const responsavelColor = RESPONSAVEL_COLORS[task.responsavel] || { bg: "bg-gray-100", text: "text-gray-700" };
  const confiancaColor = CONFIANCA_COLORS[task.confiancaIA] || { bg: "bg-gray-100", text: "text-gray-700" };
  const statusStyle = TASK_STATUS_STYLES[task.status] || { bg: "bg-gray-50", border: "border-gray-300" };

  const isActionable = task.status === "PENDING_REVIEW";
  const isDiscarded = task.status === "DISCARDED";

  return (
    <Card className={cn("border-2 transition-all", statusStyle.bg, statusStyle.border)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {isActionable && (
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(task.id, !!checked)}
              className="mt-1"
            />
          )}

          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className={cn("font-semibold text-gray-900", isDiscarded && "line-through text-gray-400")}>
                  {task.titulo}
                </h3>
                <p className={cn("text-sm text-gray-600 mt-1", isDiscarded && "line-through text-gray-400")}>
                  {task.descricao}
                </p>
              </div>
              {task.notionUrl && (
                <a href={task.notionUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={cn(responsavelColor.bg, responsavelColor.text, "border-0")}>
                {RESPONSAVEL_LABELS[task.responsavel] || task.responsavel}
              </Badge>
              <Badge variant="outline">
                {task.prazoBruto || (task.prazo ? new Date(task.prazo).toLocaleDateString("pt-BR") : "A definir")}
              </Badge>
              <Badge variant="outline">{task.cliente}</Badge>
              <Badge variant="outline" className="capitalize">{task.prioridade}</Badge>
              <Badge className={cn(confiancaColor.bg, confiancaColor.text, "border-0")}>
                Confiança: {task.confiancaIA}
              </Badge>
            </div>

            {/* Supervisor notes */}
            {task.supervisorNotes && (
              <p className="text-sm text-blue-700 bg-blue-50 rounded p-2">
                Nota do supervisor: {task.supervisorNotes}
              </p>
            )}

            {/* Trecho da reunião */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Trecho da reunião
            </button>
            {expanded && (
              <blockquote className="border-l-2 border-gray-300 pl-3 text-sm text-gray-500 italic">
                {task.trechoReuniao}
              </blockquote>
            )}

            {/* Actions */}
            {isActionable && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => onApprove(task.id)} className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-1" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(task)}>
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => onDiscard(task.id)}>
                  <X className="h-4 w-4 mr-1" /> Descartar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
