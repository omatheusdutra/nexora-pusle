import type { AttendanceStatus } from "@flowpay/shared";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { AuditActivityPanel } from "../components/audit-activity-panel";
import { DashboardPanel } from "../components/dashboard-panel";
import { PageHeader } from "../components/page-header";
import { StatusBadge } from "../components/status-badge";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { statusLabel } from "../lib/utils";

const statusOrder: AttendanceStatus[] = [
  "FINISHED",
  "IN_PROGRESS",
  "QUEUED",
  "CANCELLED"
];

export function QualityPage() {
  const attendances = useQuery({
    queryKey: ["attendances", "quality"],
    queryFn: () => api.listAttendances({ pageSize: 100 })
  });
  const audit = useQuery({
    queryKey: ["audit-events", "quality"],
    queryFn: () => api.listAuditEvents({ pageSize: 30 })
  });

  const rows = attendances.data?.data ?? [];
  const total = Math.max(rows.length, 1);
  const finished = rows.filter((row) => row.status === "FINISHED").length;
  const cancelled = rows.filter((row) => row.status === "CANCELLED").length;
  const reassigned =
    audit.data?.data.filter((event) => event.type === "ATTENDANCE_REASSIGNED")
      .length ?? 0;

  return (
    <main className="grid gap-3 px-4 py-3 sm:px-5 xl:px-6">
      <PageHeader
        eyebrow="Governanca"
        title="Qualidade"
        description="Acompanhe conclusao, cancelamentos, reatribuicoes e trilha de auditoria em tempo real."
      />

      <section className="grid gap-3 md:grid-cols-3">
        <QualityMetric
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Taxa de conclusao"
          value={`${Math.round((finished / total) * 100)}%`}
          tone="success"
        />
        <QualityMetric
          icon={<XCircle className="h-4 w-4" />}
          label="Cancelamentos"
          value={`${Math.round((cancelled / total) * 100)}%`}
          tone="destructive"
        />
        <QualityMetric
          icon={<Activity className="h-4 w-4" />}
          label="Reatribuicoes"
          value={reassigned}
          tone="primary"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_390px]">
        <DashboardPanel
          title="Status do ciclo"
          eyebrow="Controle"
          icon={<ShieldCheck className="h-4 w-4" />}
          compact
        >
          {attendances.isLoading ? (
            <Skeleton className="h-[260px]" />
          ) : (
            <div className="grid gap-3">
              {statusOrder.map((status) => {
                const count = rows.filter((row) => row.status === status).length;
                const width = Math.max(8, Math.round((count / total) * 100));

                return (
                  <div key={status} className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge status={status} />
                      <span className="text-sm font-bold tabular-nums">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted dark:bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary via-violet to-accent transition-all"
                        style={{ width: `${width}%` }}
                        aria-label={`${statusLabel(status)} ${count}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashboardPanel>
        <AuditActivityPanel />
      </section>
    </main>
  );
}

function QualityMetric({
  icon,
  label,
  value,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone: "success" | "destructive" | "primary";
}) {
  return (
    <div className="nexora-panel rounded-lg p-3">
      <div className="nexora-content flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-black tabular-nums">{value}</div>
        </div>
        <Badge variant={tone} className="h-9 w-9 justify-center rounded-md p-0">
          {icon}
        </Badge>
      </div>
    </div>
  );
}
