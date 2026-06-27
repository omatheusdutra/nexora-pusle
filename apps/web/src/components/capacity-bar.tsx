import { cn } from "../lib/utils";

export function CapacityBar({
  value,
  max,
  className
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const tone =
    percent >= 100
      ? "from-warning to-destructive shadow-[0_0_18px_-6px_hsl(var(--destructive))]"
      : percent >= 67
        ? "from-violet to-warning shadow-[0_0_18px_-6px_hsl(var(--warning))]"
        : "from-accent to-success shadow-[0_0_18px_-6px_hsl(var(--accent))]";

  return (
    <div
      className={cn(
        "h-2 overflow-hidden rounded-full border border-white/8 bg-white/8 shadow-inset",
        className
      )}
      aria-label={`Capacidade ${value} de ${max}`}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r transition-all duration-500",
          tone
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
