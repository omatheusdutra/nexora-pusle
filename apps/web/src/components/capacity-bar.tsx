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
    percent >= 100 ? "bg-destructive" : percent >= 67 ? "bg-warning" : "bg-accent";

  return (
    <div
      className={cn(
        "h-2 overflow-hidden rounded-sm border border-white/8 bg-white/8",
        className
      )}
      aria-label={`Capacidade ${value} de ${max}`}
    >
      <div
        className={cn("h-full rounded-sm transition-all duration-500", tone)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
