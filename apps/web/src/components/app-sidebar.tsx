import {
  BarChart3,
  Building2,
  Headphones,
  LayoutDashboard,
  Route,
  Settings,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import { BrandMark } from "./brand-mark";
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-black/25 px-3 py-4 backdrop-blur-2xl lg:flex lg:flex-col">
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 shadow-inset">
        <BrandMark />
        <div className="min-w-0">
          <div className="truncate text-base font-semibold">Nexora Pulse</div>
          <div className="truncate text-[11px] text-muted-foreground">
            AI Operations Command Center
          </div>
        </div>
      </div>

      <nav className="mt-5 grid gap-1.5">
        {navItems.map((item) => {
          const Icon = item.Icon;

          return (
            <button
              key={item.label}
              type="button"
              className={`group relative flex h-9 items-center gap-3 overflow-hidden rounded-md px-3 text-left text-sm transition-all ${
                item.active
                  ? "border border-primary/30 bg-gradient-to-r from-primary/18 via-violet/10 to-transparent text-foreground shadow-glow"
                  : "border border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/7 hover:text-foreground"
              }`}
            >
              {item.active ? (
                <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary))]" />
              ) : null}
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-accent/20 bg-gradient-to-br from-accent/12 via-white/5 to-violet/10 p-4 shadow-glow scanline">
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
