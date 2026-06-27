import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";
import { Card } from "./ui/card";

export function DashboardPanel({
  title,
  eyebrow,
  action,
  icon,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          {icon ? (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/7 text-primary shadow-glow">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {eyebrow}
              </div>
            ) : null}
            <h2 className="truncate text-base font-semibold tracking-normal">
              {title}
            </h2>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}
