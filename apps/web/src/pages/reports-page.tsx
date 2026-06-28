import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, Gauge, TimerReset } from "lucide-react";
import { lazy, Suspense, type ReactNode } from "react";
import { DashboardPanel } from "../components/dashboard-panel";
import { MetricsGrid } from "../components/metrics-grid";
import { PageHeader } from "../components/page-header";
import { TeamDistributionChart } from "../components/team-distribution-chart";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { formatPercent, formatSeconds } from "../lib/utils";

const DashboardCharts = lazy(() => import("../components/dashboard-charts"));

export function ReportsPage() {
  const summary = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: api.getSummary
  });
  const queues = useQuery({
    queryKey: ["dashboard", "queues"],
    queryFn: api.getQueues
  });
  const attendantsLoad = useQuery({
    queryKey: ["dashboard", "attendants-load"],
    queryFn: api.getAttendantsLoad
  });

  return (
    <main className="grid gap-3 px-4 py-3 sm:px-5 xl:px-6">
      <PageHeader
        eyebrow="Inteligencia"
        title="Relatórios"
        description="Indicadores executivos, capacidade e distribuição para fechamento operacional."
        action={
          <Button type="button" variant="outline" size="sm">
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Button>
        }
      />

      <MetricsGrid summary={summary.data} loading={summary.isLoading} />

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Suspense fallback={<Skeleton className="h-[266px]" />}>
          <DashboardCharts
            attendantsLoad={attendantsLoad.data}
            attendantsLoading={attendantsLoad.isLoading}
            queues={queues.data}
            queuesLoading={queues.isLoading}
          />
        </Suspense>
        <DashboardPanel
          title="SLA operacional"
          eyebrow="Resumo"
          icon={<TimerReset className="h-4 w-4" />}
          compact
        >
          <div className="grid gap-3">
            <ReportMetric
              icon={<Gauge className="h-4 w-4" />}
              label="Uso da capacidade"
              value={
                summary.data
                  ? formatPercent(summary.data.capacityUtilization)
                  : "--"
              }
            />
            <ReportMetric
              icon={<TimerReset className="h-4 w-4" />}
              label="Espera media"
              value={
                summary.data
                  ? formatSeconds(summary.data.averageWaitSeconds)
                  : "--"
              }
            />
            <ReportMetric
              icon={<BarChart3 className="h-4 w-4" />}
              label="Fila total"
              value={summary.data?.queued ?? "--"}
            />
          </div>
        </DashboardPanel>
      </section>

      <TeamDistributionChart />
    </main>
  );
}

function ReportMetric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md border border-primary/20 bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="truncate text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-xl font-black tabular-nums">{value}</span>
    </div>
  );
}
