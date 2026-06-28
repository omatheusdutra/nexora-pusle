import {
  BarChart3,
  Building2,
  Headphones,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Route as RouteIcon,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserPlus,
  UsersRound
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { BrandMark } from "./brand-mark";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const navItems = [
  { label: "Visão Geral", path: "/dashboard", Icon: LayoutDashboard },
  { label: "Atendimentos", path: "/attendances", Icon: Headphones },
  { label: "Fila & Rotas", path: "/queues", Icon: RouteIcon },
  { label: "Atendentes", path: "/attendants", Icon: UsersRound },
  { label: "Clientes", path: "/clients", Icon: Building2 },
  { label: "Relatórios", path: "/reports", Icon: BarChart3 },
  { label: "Qualidade", path: "/quality", Icon: ShieldCheck },
  { label: "Configurações", path: "/settings", Icon: Settings },
  { label: "Meu perfil", path: "/profile", Icon: UserRound },
  { label: "Usuários", path: "/users", Icon: UserPlus, adminOnly: true }
];

export function AppSidebar({
  collapsed,
  onToggleCollapsed
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const { user } = useAuth();
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "ADMIN"
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden border-r border-border/80 bg-surface px-3 py-4 backdrop-blur-2xl transition-all duration-300 dark:border-white/10 lg:flex lg:flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-1",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <BrandMark compact />
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-black uppercase tracking-[0.16em] text-foreground 2xl:text-sm">
              Nexora Pulse
            </div>
            <div className="truncate text-[10px] text-muted-foreground">
              Centro de Operações
            </div>
          </div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="h-8 w-8 shrink-0"
          onClick={onToggleCollapsed}
        >
          <ToggleIcon className="h-4 w-4" />
        </Button>
      </div>

      <nav className="mt-7 grid gap-1.5">
        {visibleNavItems.map((item) => {
          const Icon = item.Icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "group relative flex h-9 items-center overflow-hidden rounded-md border px-2.5 text-left text-[12px] font-semibold transition-all 2xl:text-sm",
                  collapsed ? "justify-center gap-0" : "gap-2",
                  isActive
                    ? "border-primary/30 bg-gradient-to-r from-primary/18 via-violet/10 to-transparent text-foreground shadow-glow"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-background/60 hover:text-foreground dark:hover:border-white/10 dark:hover:bg-white/7"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary))]" />
                  ) : null}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-primary" : "group-hover:text-primary"
                    )}
                  />
                  {!collapsed ? (
                    <span className="truncate">{item.label}</span>
                  ) : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div
        className={cn(
          "nexora-panel mt-auto rounded-lg scanline",
          collapsed ? "grid place-items-center p-2" : "p-3"
        )}
      >
        <div className="nexora-content">
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed ? "justify-center" : "justify-between"
            )}
          >
            <div className="grid h-9 w-9 place-items-center rounded-md border border-accent/25 bg-accent/12 text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            {!collapsed ? <Badge variant="success">Ativo</Badge> : null}
          </div>
          {!collapsed ? (
            <>
              <div className="mt-4 text-sm font-semibold">Nexora AI</div>
              <div className="mt-1 text-xs leading-5 text-muted-foreground">
                Roteamento inteligente ativo
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted dark:bg-white/8">
                <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-primary via-violet to-accent shadow-neon" />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
