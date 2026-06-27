import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const variants: Record<string, string> = {
  neutral:
    "bg-background/70 text-muted-foreground border-border dark:bg-white/6 dark:border-white/10",
  success: "bg-success/12 text-success border-success/35 shadow-[0_0_24px_-18px_hsl(var(--success))]",
  warning: "bg-warning/12 text-warning border-warning/35 shadow-[0_0_24px_-18px_hsl(var(--warning))]",
  destructive:
    "bg-destructive/12 text-destructive border-destructive/35 shadow-[0_0_24px_-18px_hsl(var(--destructive))]",
  primary: "bg-primary/12 text-primary border-primary/35 shadow-[0_0_24px_-18px_hsl(var(--primary))]",
  violet: "bg-violet/12 text-violet border-violet/35 shadow-[0_0_24px_-18px_hsl(var(--violet))]"
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tracking-normal shadow-inset",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
