import {
  BarChart3,
  Building2,
  Gauge,
  Headphones,
  LayoutDashboard,
  Route,
  Settings,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import { Badge } from "./ui/badge";

const navItems = [
  { label: "Visão Geral", Icon: LayoutDashboard, active: true },
  { label: "Atendimentos", Icon: Headphones },
  { label: "Fila & Rotas", Icon: Route },
  { label: "Atendentes", Icon: UsersRound },
  { label: "Clientes", Icon: Building2 },
  { label: "Relatórios", Icon: BarChart3 },
  { label: "Qualidade", Icon: ShieldCheck },
  { label: "Configurações", Icon: Settings }
];

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-black/20 px-4 py-5 backdrop-blur-2xl lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-11 w-11 place-items-center rounded-md border border-primary/30 bg-primary/12 text-primary shadow-glow">
          <Gauge className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">Nexora Pulse</div>
          <div className="truncate text-xs text-muted-foreground">
            AI Operations Command Center
          </div>
        </div>
      </div>

      <nav className="mt-8 grid gap-1">
        {navItems.map((item) => {
          const Icon = item.Icon;

          return (
            <button
              key={item.label}
              type="button"
              className={`flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm transition-all ${
                item.active
                  ? "border border-primary/25 bg-primary/12 text-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-white/7 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-accent/20 bg-accent/8 p-4 shadow-glow">
        <div className="flex items-center justify-between gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md border border-accent/25 bg-accent/12 text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <Badge variant="success">Ativo</Badge>
        </div>
        <div className="mt-4 text-sm font-semibold">Nexora AI</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">
          Roteamento inteligente ativo
        </div>
      </div>
    </aside>
  );
}
