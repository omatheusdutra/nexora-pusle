import type { AttendantLoadDto } from "@flowpay/shared";
import { Power } from "lucide-react";
import { CapacityBar } from "./capacity-bar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { displayTeamName, initialsFor } from "../lib/utils";

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

  return (
    <div className="group rounded-lg border border-white/10 bg-white/6 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-white/8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-white/10 bg-gradient-to-br from-primary/25 via-violet/15 to-accent/20 text-sm font-semibold text-foreground shadow-glow">
            {initialsFor(attendant.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{attendant.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {displayTeamName(attendant.teamName, attendant.teamType)}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant={
              full ? "warning" : attendant.isOnline ? "success" : "neutral"
            }
          >
            {full ? "Lotado" : attendant.isOnline ? "Online" : "Offline"}
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

      <div className="mt-4 flex items-center gap-3">
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
