import type { AttendantLoadDto } from "@flowpay/shared";
import { Power } from "lucide-react";
import { CapacityBar } from "./capacity-bar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn, displayTeamName, initialsFor, teamTone } from "../lib/utils";

export function AgentCard({
  attendant,
  disabled,
  onToggle
}: {
  attendant: AttendantLoadDto;
  disabled: boolean;
  onToggle: () => void;
}) {
  const full = attendant.currentLoad >= attendant.maxConcurrentAttendances;
  const tone = teamTone(attendant.teamName, attendant.teamType);
  const statusLabel = full
    ? "Lotado"
    : attendant.isOnline
      ? "Online"
      : "Offline";

  return (
    <div
      className={cn(
        "group rounded-lg border bg-background/60 p-3 shadow-inset transition-all duration-200 hover:-translate-y-0.5 hover:bg-card dark:bg-white/6 dark:hover:bg-white/8",
        full
          ? "border-warning/30 shadow-[0_0_36px_-26px_hsl(var(--warning))]"
          : "border-border hover:border-primary/30 dark:border-white/10"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-md border bg-gradient-to-br text-xs font-black text-foreground shadow-glow",
              tone.border,
              tone.background
            )}
          >
            {initialsFor(attendant.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{attendant.name}</div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", tone.dot)} />
              <span className="truncate">
                {displayTeamName(attendant.teamName, attendant.teamType)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge
            variant={
              full ? "warning" : attendant.isOnline ? "success" : "neutral"
            }
          >
            {statusLabel}
          </Badge>
          <Button
            size="icon"
            variant="ghost"
            title={attendant.isOnline ? "Ficar offline" : "Ficar online"}
            aria-label={attendant.isOnline ? "Ficar offline" : "Ficar online"}
            disabled={disabled}
            onClick={onToggle}
          >
            <Power className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <CapacityBar
          value={attendant.currentLoad}
          max={attendant.maxConcurrentAttendances}
          className="flex-1"
        />
        <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
          {attendant.currentLoad}/{attendant.maxConcurrentAttendances}
        </span>
      </div>
    </div>
  );
}
