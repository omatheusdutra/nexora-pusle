import { useQueryClient } from "@tanstack/react-query";
import { Database, RefreshCw, Settings, Wifi } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { AppShellContext } from "../components/app-shell";
import { DashboardPanel } from "../components/dashboard-panel";
import { PageHeader } from "../components/page-header";
import { RealtimeIndicator } from "../components/realtime-indicator";
import { ThemeToggle } from "../components/theme-toggle";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export function SettingsPage() {
  const { connected, dark, onToggleTheme } =
    useOutletContext<AppShellContext>();
  const queryClient = useQueryClient();

  return (
    <main className="grid gap-3 px-4 py-3 sm:px-5 xl:px-6">
      <PageHeader
        eyebrow="Preferencias"
        title="Configuracoes"
        description="Ajustes de experiencia, conexao em tempo real e sincronizacao local do painel."
      />

      <section className="grid gap-3 xl:grid-cols-2">
        <DashboardPanel
          title="Aparencia"
          eyebrow="Tema"
          icon={<Settings className="h-4 w-4" />}
          compact
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3 dark:border-white/10 dark:bg-white/5">
            <div>
              <div className="text-sm font-bold">
                {dark ? "Tema escuro" : "Tema claro"}
              </div>
              <div className="text-xs text-muted-foreground">
                Preferencia salva em nexora-pulse-theme.
              </div>
            </div>
            <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <span className="h-12 rounded-md border border-primary/25 bg-primary/20" />
            <span className="h-12 rounded-md border border-violet/25 bg-violet/20" />
            <span className="h-12 rounded-md border border-accent/25 bg-accent/20" />
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Sincronizacao"
          eyebrow="Realtime"
          icon={<Wifi className="h-4 w-4" />}
          compact
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3 dark:border-white/10 dark:bg-white/5">
            <div>
              <div className="text-sm font-bold">Canal Socket.IO</div>
              <div className="text-xs text-muted-foreground">
                Invalida metricas, filas e atendimentos automaticamente.
              </div>
            </div>
            <RealtimeIndicator connected={connected} label="Conectado" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => void queryClient.invalidateQueries()}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar dados
          </Button>
        </DashboardPanel>
      </section>

      <DashboardPanel
        title="Ambiente"
        eyebrow="Sistema"
        icon={<Database className="h-4 w-4" />}
        compact
      >
        <div className="grid gap-2 md:grid-cols-3">
          <SettingItem
            label="API"
            value={import.meta.env.VITE_API_URL ?? "localhost:3333"}
          />
          <SettingItem label="Sidebar" value="persistente" />
          <SettingItem label="Favicon" value="SVG oficial" />
        </div>
      </DashboardPanel>
    </main>
  );
}

function SettingItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold">{value}</span>
        <Badge variant="primary">OK</Badge>
      </div>
    </div>
  );
}
