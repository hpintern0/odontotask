"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Configurações do sistema e integrações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Chaves de API
          </CardTitle>
          <CardDescription>
            As chaves de API são configuradas como variáveis de ambiente no Railway.
            Não armazene chaves diretamente no frontend por segurança.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">ANTHROPIC_API_KEY</label>
            <Input disabled placeholder="Configurado via Railway" type="password" value="••••••••••" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">TLDV_API_KEY</label>
            <Input disabled placeholder="Configurado via Railway" type="password" value="••••••••••" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">NOTION_API_KEY</label>
            <Input disabled placeholder="Configurado via Railway" type="password" value="••••••••••" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">NOTION_DATABASE_ID</label>
            <Input disabled placeholder="Configurado via Railway" value="••••••••••" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status das Integrações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded border p-3">
            <div>
              <p className="font-medium">TLDV</p>
              <p className="text-sm text-gray-500">Transcrição de reuniões</p>
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-1">
              Verificar no Railway
            </span>
          </div>
          <div className="flex items-center justify-between rounded border p-3">
            <div>
              <p className="font-medium">Anthropic Claude</p>
              <p className="text-sm text-gray-500">Extração de tarefas com IA</p>
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-1">
              Verificar no Railway
            </span>
          </div>
          <div className="flex items-center justify-between rounded border p-3">
            <div>
              <p className="font-medium">Notion</p>
              <p className="text-sm text-gray-500">Publicação de tarefas</p>
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-1">
              Verificar no Railway
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
