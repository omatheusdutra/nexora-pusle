import {
  Bell,
  Command,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { ConnectionBadge } from "./connection-badge";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function AppHeader({
  connected,
  dark,
  onToggleTheme,
  onRefresh
}: {
  connected: boolean;
  dark: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-background/70 backdrop-blur-2xl">
      <div className="flex min-h-20 flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="grid h-9 w-9 place-items-center rounded-md border border-primary/30 bg-primary/12 text-primary">
                <Command className="h-4 w-4" />
              </div>
              <span className="font-semibold">Nexora Pulse</span>
            </div>
            <ConnectionBadge connected={connected} />
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-success/25 bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sistema ao vivo
            </span>
          </div>
          <div className="mt-2 hidden lg:block">
            <h1 className="text-2xl font-semibold tracking-normal">
              Centro Inteligente de Operações
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              AI Operations Command Center
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row xl:max-w-3xl xl:justify-end">
          <label className="relative min-w-0 flex-1 xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar atendimento, cliente ou atendente"
              aria-label="Busca global"
            />
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Atualizar"
              aria-label="Atualizar"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Notificações"
              aria-label="Notificações"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <ThemeToggle dark={dark} onToggle={onToggleTheme} />
            <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/6 px-2 py-1.5 sm:flex">
              <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary/15 text-primary">
                <UserRound className="h-4 w-4" />
              </div>
              <div className="min-w-0 pr-1">
                <div className="text-xs font-semibold">Supervisor</div>
                <div className="text-[11px] text-muted-foreground">Operações</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
