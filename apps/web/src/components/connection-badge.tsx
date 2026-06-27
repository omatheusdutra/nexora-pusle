import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "./ui/badge";

export function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <Badge variant={connected ? "success" : "warning"} className="gap-1.5">
      {connected ? (
        <Wifi className="h-3.5 w-3.5" />
      ) : (
        <WifiOff className="h-3.5 w-3.5" />
      )}
      {connected ? "Tempo real ativo" : "Reconectando"}
    </Badge>
  );
}
