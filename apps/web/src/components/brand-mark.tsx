import { Activity, Hexagon } from "lucide-react";
import { cn } from "../lib/utils";

export function BrandMark({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 shadow-neon",
        compact ? "h-9 w-9" : "h-11 w-11",
        className
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-1 rounded-md border border-white/10 bg-black/15 shadow-inset" />
      <Hexagon
        className={cn(
          "relative text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.65)]",
          compact ? "h-5 w-5" : "h-6 w-6"
        )}
        strokeWidth={1.8}
      />
      <Activity
        className={cn(
          "absolute text-accent drop-shadow-[0_0_10px_hsl(var(--accent)/0.75)]",
          compact ? "h-3.5 w-3.5" : "h-4 w-4"
        )}
        strokeWidth={2.4}
      />
      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success text-success pulse-dot" />
    </div>
  );
}
