import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";
import { Card } from "./ui/card";

export function DashboardPanel({
  title,
  eyebrow,
  action,
  icon,
  live = false,
  compact = false,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  icon?: ReactNode;
  live?: boolean;
  compact?: boolean;
}) {
  return (
    <Card
      className={cn(
        "group transition-all duration-300 hover:border-primary/25 hover:shadow-neon",
        className
      )}
      {...props}
    >
      <div className="nexora-content">
        <div
          className={cn(
            "flex items-start justify-between gap-4 border-b border-border/80 dark:border-white/8",
            compact ? "px-3.5 py-2.5" : "px-4 py-3"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            {icon ? (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-primary/20 bg-primary/10 text-primary shadow-neon">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              {eyebrow ? (
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {eyebrow}
                </div>
              ) : null}
              <h2 className="truncate text-sm font-bold tracking-normal">
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
        <div className={cn(compact ? "p-3.5" : "p-4")}>{children}</div>
      </div>
    </Card>
  );
}
