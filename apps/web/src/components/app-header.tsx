import {
  Bell,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { BrandMark } from "./brand-mark";
import { RealtimeIndicator } from "./realtime-indicator";
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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-background/72 backdrop-blur-2xl">
      <div className="flex min-h-[72px] flex-col gap-3 px-4 py-3 sm:px-5 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <BrandMark compact />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <RealtimeIndicator connected={connected} />
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 text-xs font-semibold text-primary shadow-inset">
                <ShieldCheck className="h-3.5 w-3.5" />
                Tempo real {connected ? "ativo" : "pendente"}
              </span>
            </div>
            <div className="mt-1 hidden lg:block">
              <h1 className="truncate text-xl font-semibold tracking-normal">
                Centro Inteligente de Operações
              </h1>
              <p className="text-xs text-muted-foreground">
                AI Operations Command Center
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row xl:max-w-3xl xl:justify-end">
          <label className="relative min-w-0 flex-1 xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
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
              className="relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warning shadow-[0_0_12px_hsl(var(--warning))]" />
            </Button>
            <ThemeToggle dark={dark} onToggle={onToggleTheme} />
            <div className="hidden h-9 items-center gap-2 rounded-md border border-white/10 bg-white/6 px-2 shadow-inset sm:flex">
              <div className="grid h-7 w-7 place-items-center rounded-sm border border-primary/20 bg-primary/15 text-primary">
                <UserRound className="h-4 w-4" />
              </div>
              <div className="min-w-0 pr-1">
                <div className="text-xs font-semibold">Lucas Almeida</div>
                <div className="text-[11px] text-muted-foreground">
                  Supervisor de Operações
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
