import type { AuditEventDto, AuditEventType } from "@flowpay/shared";
import { useQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import {
  Activity,
  ArrowRightLeft,
  CheckCircle2,
  CirclePlus,
  Clock3,
  UserCheck,
  UserX
} from "lucide-react";
import { api } from "../lib/api";
import { DashboardPanel } from "./dashboard-panel";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

const eventLabels: Record<AuditEventType, string> = {
  ATTENDANCE_CREATED: "Atendimento criado",
  ATTENDANCE_ASSIGNED: "Atendimento atribuido",
  ATTENDANCE_QUEUED: "Atendimento em fila",
  ATTENDANCE_FINISHED: "Atendimento finalizado",
  ATTENDANCE_CANCELLED: "Atendimento cancelado",
  ATTENDANCE_REASSIGNED: "Atendimento reatribuido",
  ATTENDANT_ONLINE: "Atendente online",
  ATTENDANT_OFFLINE: "Atendente offline"
};

const eventVariants: Record<
  AuditEventType,
  ComponentProps<typeof Badge>["variant"]
> = {
  ATTENDANCE_CREATED: "primary",
  ATTENDANCE_ASSIGNED: "success",
  ATTENDANCE_QUEUED: "warning",
  ATTENDANCE_FINISHED: "success",
  ATTENDANCE_CANCELLED: "destructive",
  ATTENDANCE_REASSIGNED: "violet",
  ATTENDANT_ONLINE: "success",
  ATTENDANT_OFFLINE: "warning"
};

const eventIcons: Record<AuditEventType, typeof Activity> = {
  ATTENDANCE_CREATED: CirclePlus,
  ATTENDANCE_ASSIGNED: UserCheck,
  ATTENDANCE_QUEUED: Clock3,
  ATTENDANCE_FINISHED: CheckCircle2,
  ATTENDANCE_CANCELLED: UserX,
  ATTENDANCE_REASSIGNED: ArrowRightLeft,
  ATTENDANT_ONLINE: UserCheck,
  ATTENDANT_OFFLINE: UserX
};

export function AuditActivityPanel() {
  const audit = useQuery({
    queryKey: ["audit-events", "latest"],
    queryFn: () => api.listAuditEvents({ pageSize: 8 })
  });

  if (audit.isLoading) {
    return <Skeleton className="h-[228px]" />;
  }

  return (
    <DashboardPanel
      title="Auditoria"
      eyebrow="Eventos"
      icon={<Activity className="h-4 w-4" />}
      live
      compact
    >
      {audit.data?.data.length ? (
        <div className="grid max-h-[250px] gap-2 overflow-y-auto pr-1 nexora-scrollbar">
          {audit.data.data.map((event) => (
            <AuditEventRow key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum evento registrado
        </div>
      )}
    </DashboardPanel>
  );
}

function AuditEventRow({ event }: { event: AuditEventDto }) {
  const Icon = eventIcons[event.type];

  return (
    <div className="grid grid-cols-[2rem_1fr] gap-3 rounded-md border border-border bg-background/60 px-3 py-2.5 shadow-inset dark:border-white/10 dark:bg-white/5">
      <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-md border border-border bg-background/60 text-muted-foreground dark:border-white/10">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">
            {eventLabels[event.type]}
          </span>
          <Badge variant={eventVariants[event.type]} className="shrink-0">
            {event.entityType}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono">#{event.entityId.slice(-6)}</span>
          <span>{formatAuditTime(event.createdAt)}</span>
          {formatAuditPayload(event) ? (
            <span>{formatAuditPayload(event)}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatAuditTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatAuditPayload(event: AuditEventDto) {
  if (!event.payload || typeof event.payload !== "object") {
    return null;
  }

  const payload = event.payload as Record<string, unknown>;
  const source = payload.source ?? payload.reason;

  if (typeof source === "string") {
    return source.replace(/_/g, " ").toLowerCase();
  }

  if (typeof payload.queued === "number" && payload.queued > 0) {
    return `${payload.queued} em fila`;
  }

  if (typeof payload.reassigned === "number" && payload.reassigned > 0) {
    return `${payload.reassigned} reatribuidos`;
  }

  return null;
}
