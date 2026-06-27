import { Wifi, WifiOff } from "lucide-react";
import { cn } from "../lib/utils";

export function RealtimeIndicator({
  connected,
  className,
  label = "Sistema ao vivo"
}: {
  connected: boolean;
  className?: string;
  label?: string;
}) {
  const Icon = connected ? Wifi : WifiOff;

  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold shadow-inset",
        connected
          ? "border-success/35 bg-success/10 text-success"
          : "border-warning/35 bg-warning/10 text-warning",
        className
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          connected ? "bg-success text-success pulse-dot" : "bg-warning"
        )}
      />
      <Icon className="h-3.5 w-3.5" />
      <span className="whitespace-nowrap">
        {connected ? label : "Reconectando"}
      </span>
    </span>
  );
}
