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
    primary: "text-primary bg-primary/12 border-primary/30",
    accent: "text-accent bg-accent/12 border-accent/30",
    success: "text-success bg-success/12 border-success/30",
    warning: "text-warning bg-warning/12 border-warning/30",
    violet: "text-violet bg-violet/12 border-violet/30"
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/6 p-4 shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/55 to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-3 truncate text-3xl font-semibold tracking-normal">
            {value}
          </div>
        </div>
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-md border",
            toneClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 inline-flex max-w-full items-center gap-1.5 rounded-sm border border-white/10 bg-black/10 px-2 py-1 text-xs text-muted-foreground dark:bg-white/5">
        <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
        <span className="truncate">{trend}</span>
      </div>
    </div>
  );
}
