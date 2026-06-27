import {
  Bell,
  Command,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { BrandMark } from "./brand-mark";
import { RealtimeIndicator } from "./realtime-indicator";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function AppHeader({
  connected,
  dark,
  onToggleTheme,
  onRefresh,
  onSearchFocus
}: {
  connected: boolean;
  dark: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
  onSearchFocus?: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-surface backdrop-blur-2xl dark:border-white/10 dark:bg-[#030916]/68">
      <div className="flex min-h-[64px] flex-col gap-2 px-4 py-2.5 sm:px-5 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <BrandMark compact />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <RealtimeIndicator connected={connected} label="Tempo real" />
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 text-xs font-semibold text-primary shadow-inset">
                <ShieldCheck className="h-3.5 w-3.5" />
                Tempo real {connected ? "ativo" : "pendente"}
              </span>
            </div>
            <div className="mt-1 hidden lg:block">
              <h1 className="truncate text-xl font-semibold tracking-normal">
                Centro Inteligente de Operacoes
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
              onFocus={onSearchFocus}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-border bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground xl:inline-flex dark:border-white/10 dark:bg-white/6">
              <Command className="h-3 w-3" /> K
            </span>
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Ajustes"
              aria-label="Ajustes"
              onClick={() => navigate("/settings")}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
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
              title="Relatórios de alertas"
              aria-label="Relatórios de alertas"
              className="relative"
              onClick={() => navigate("/reports")}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warning shadow-[0_0_12px_hsl(var(--warning))]" />
            </Button>
            <ThemeToggle dark={dark} onToggle={onToggleTheme} />
            <div className="hidden h-9 items-center gap-2 rounded-md border border-border bg-background/60 px-2 shadow-inset sm:flex dark:border-white/10 dark:bg-white/6">
              <div className="grid h-7 w-7 place-items-center rounded-sm border border-primary/20 bg-primary/15 text-primary">
                <UserRound className="h-4 w-4" />
              </div>
              <div className="min-w-0 pr-1">
                <div className="truncate text-xs font-semibold">
                  {user?.name ?? "Usuário"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {user?.role ?? "OPERATIONS"}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Sair"
                aria-label="Sair"
                onClick={handleLogout}
                className="h-7 w-7"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Sair"
              aria-label="Sair"
              onClick={handleLogout}
              className="sm:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
