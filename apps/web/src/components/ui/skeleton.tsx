import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md border border-border bg-muted/70 dark:border-white/8 dark:bg-white/7",
        className
      )}
      {...props}
    />
  );
}
