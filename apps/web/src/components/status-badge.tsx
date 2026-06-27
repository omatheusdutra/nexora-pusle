import type { AttendanceStatus } from "@flowpay/shared";
import { Circle, CircleCheck, CircleSlash, Timer } from "lucide-react";
import { statusLabel } from "../lib/utils";
import { Badge } from "./ui/badge";

const config: Record<
  AttendanceStatus,
  {
    variant: "primary" | "warning" | "success" | "destructive";
    Icon: typeof Circle;
  }
> = {
  IN_PROGRESS: { variant: "primary", Icon: Timer },
  QUEUED: { variant: "warning", Icon: Circle },
  FINISHED: { variant: "success", Icon: CircleCheck },
  CANCELLED: { variant: "destructive", Icon: CircleSlash }
};

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  const item = config[status];
  const Icon = item.Icon;

  return (
    <Badge variant={item.variant} className="gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {statusLabel(status)}
    </Badge>
  );
}
