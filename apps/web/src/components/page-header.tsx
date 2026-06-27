import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export function PageHeader({
  title,
  eyebrow,
  description,
  action,
  className
}: {
  title: string;
  eyebrow: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "nexora-panel rounded-lg px-4 py-3 sm:px-5",
        className
      )}
    >
      <div className="nexora-content flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </div>
          <h1 className="mt-1 truncate text-xl font-black tracking-normal text-foreground">
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
