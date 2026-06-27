import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";
import { Card } from "./ui/card";

export function DashboardPanel({
  title,
  eyebrow,
  action,
  icon,
  live = false,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  icon?: ReactNode;
  live?: boolean;
}) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:border-primary/25 hover:shadow-neon",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-80" />
      <div className="pointer-events-none absolute inset-0 nexora-grid opacity-[0.16] [mask-image:linear-gradient(180deg,black,transparent_68%)]" />
      <div className="relative flex items-start justify-between gap-4 border-b border-white/8 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {icon ? (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-primary/20 bg-primary/10 text-primary shadow-glow">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {eyebrow}
              </div>
            ) : null}
            <h2 className="truncate text-sm font-semibold tracking-normal">
              {title}
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {live ? (
            <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-success">
              Ao vivo
            </span>
          ) : null}
          {action ? <div>{action}</div> : null}
        </div>
      </div>
      <div className="relative p-4">{children}</div>
    </Card>
  );
}
