import type { ComponentType } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../lib/utils";

export function MetricCard({
  label,
  value,
  trend,
  Icon,
  tone = "primary"
}: {
  label: string;
  value: string | number;
  trend: string;
  Icon: ComponentType<{ className?: string }>;
  tone?: "primary" | "accent" | "success" | "warning" | "violet";
}) {
  const toneClass = {
    primary: "text-primary bg-primary/12 border-primary/30 shadow-[0_0_28px_-18px_hsl(var(--primary))]",
    accent: "text-accent bg-accent/12 border-accent/30 shadow-[0_0_28px_-18px_hsl(var(--accent))]",
    success: "text-success bg-success/12 border-success/30 shadow-[0_0_28px_-18px_hsl(var(--success))]",
    warning: "text-warning bg-warning/12 border-warning/30 shadow-[0_0_28px_-18px_hsl(var(--warning))]",
    violet: "text-violet bg-violet/12 border-violet/30 shadow-[0_0_28px_-18px_hsl(var(--violet))]"
  }[tone];

  return (
    <div className="group relative min-h-[104px] overflow-hidden rounded-lg border border-white/10 bg-white/6 p-3.5 shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-neon">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-80" />
      <div className="absolute inset-0 nexora-grid opacity-[0.12] [mask-image:linear-gradient(130deg,black,transparent_62%)]" />
      <div className="flex items-start justify-between gap-3">
        <div className="relative min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 truncate text-2xl font-semibold tracking-normal tabular-nums sm:text-3xl">
            {value}
          </div>
        </div>
        <div
          className={cn(
            "relative grid h-10 w-10 shrink-0 place-items-center rounded-md border",
            toneClass
          )}
        >
          <span className="absolute inset-1 rounded-sm border border-white/10" />
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="relative mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-black/10 px-2 py-1 text-[11px] text-muted-foreground dark:bg-white/5">
        <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
        <span className="truncate">{trend}</span>
      </div>
    </div>
  );
}
