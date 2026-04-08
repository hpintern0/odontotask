"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Meeting, Task } from "@/packages/types";

interface MeetingWithTasks extends Meeting {
  tasks: Pick<Task, "id" | "status" | "responsavel">[];
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  PENDING_REVIEW: "Aguardando Revisão",
  PARTIALLY_APPROVED: "Parcialmente Aprovado",
  APPROVED: "Aprovado",
  PUBLISHED: "Publicado",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  PENDING_REVIEW: "bg-orange-100 text-orange-700",
  PARTIALLY_APPROVED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  PUBLISHED: "bg-purple-100 text-purple-700",
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    try {
      const res = await fetch("/api/meetings");
      const data = await res.json();
      if (data.success) setMeetings(data.data);
    } catch {
      toast.error("Erro ao carregar reuniões");
    } finally {
      setLoading(false);
    }
  }

  const filtered = meetings.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reuniões</h1>
        <p className="text-gray-500 mt-1">Todas as reuniões processadas pelo sistema</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por título..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {meetings.length === 0
              ? "Nenhuma reunião encontrada. Busque uma reunião do TLDV no Dashboard."
              : "Nenhuma reunião corresponde aos filtros aplicados."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((meeting) => {
            const pendingCount = meeting.tasks.filter((t) => t.status === "PENDING_REVIEW").length;
            const approvedCount = meeting.tasks.filter((t) => t.status === "APPROVED" || t.status === "PUBLISHED").length;

            return (
              <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                <Card className="hover:border-blue-300 transition-colors cursor-pointer mb-3">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>{new Date(meeting.date).toLocaleDateString("pt-BR")}</span>
                        <span>{meeting.tasks.length} tarefas</span>
                        {pendingCount > 0 && (
                          <span className="text-orange-600">{pendingCount} pendentes</span>
                        )}
                        {approvedCount > 0 && (
                          <span className="text-green-600">{approvedCount} aprovadas</span>
                        )}
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[meeting.status] || ""}`}>
                      {statusLabels[meeting.status] || meeting.status}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
