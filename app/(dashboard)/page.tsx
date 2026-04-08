"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, ClipboardCheck, Send, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Meeting, Task } from "@/packages/types";

interface MeetingWithTasks extends Meeting {
  tasks: Pick<Task, "id" | "status" | "responsavel">[];
}

interface DashboardStats {
  totalMeetings: number;
  pendingReview: number;
  publishedTasks: number;
}

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<MeetingWithTasks[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalMeetings: 0, pendingReview: 0, publishedTasks: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchInput, setFetchInput] = useState("");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [meetingsRes, statsRes] = await Promise.all([
        fetch("/api/meetings"),
        fetch("/api/stats"),
      ]);
      const meetingsData = await meetingsRes.json();
      const statsData = await statsRes.json();

      if (meetingsData.success) {
        setMeetings(meetingsData.data as MeetingWithTasks[]);
      }

      if (statsData.success) {
        setStats({
          totalMeetings: statsData.data.meetings.total,
          pendingReview: statsData.data.tasks.pendingReview,
          publishedTasks: statsData.data.tasks.published,
        });
      }
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchMeeting() {
    if (!fetchInput.trim()) return;
    setFetching(true);

    try {
      const isUrl = fetchInput.includes("tldv.io") || fetchInput.includes("http");
      const body = isUrl
        ? { meetingUrl: fetchInput }
        : { meetingId: fetchInput };

      const res = await fetch("/api/fetch-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Reunião processada com sucesso!");
        setFetchInput("");
        loadData();
      } else {
        toast.error(data.error || "Erro ao buscar reunião");
      }
    } catch {
      toast.error("Erro ao buscar reunião");
    } finally {
      setFetching(false);
    }
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral do sistema de gestão de tarefas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {loading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Reuniões Processadas</CardTitle>
                <Video className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalMeetings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Tarefas Pendentes de Revisão</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{stats.pendingReview}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Tarefas Publicadas no Notion</CardTitle>
                <Send className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.publishedTasks}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Fetch Meeting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar Nova Reunião</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Cole a URL do TLDV ou ID da reunião..."
              value={fetchInput}
              onChange={(e) => setFetchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetchMeeting()}
              disabled={fetching}
            />
            <Button onClick={handleFetchMeeting} disabled={fetching || !fetchInput.trim()}>
              {fetching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Meetings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Últimas Reuniões</h2>
          <Link href="/meetings">
            <Button variant="outline" size="sm">Ver todas</Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : meetings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Nenhuma reunião processada ainda. Use o campo acima para buscar uma reunião do TLDV.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {meetings.slice(0, 5).map((meeting) => (
              <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(meeting.date).toLocaleDateString("pt-BR")} — {meeting.tasks.length} tarefas
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[meeting.status] || ""}`}>
                      {statusLabels[meeting.status] || meeting.status}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
