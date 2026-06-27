import { useQuery } from "@tanstack/react-query";
import { Gauge, UsersRound } from "lucide-react";
import { AttendantsPanel } from "../components/attendants-panel";
import { DashboardPanel } from "../components/dashboard-panel";
import { LoadChart } from "../components/load-chart";
import { PageHeader } from "../components/page-header";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/api";
import { displayTeamName } from "../lib/utils";

export function AttendantsPage() {
  const attendantsLoad = useQuery({
    queryKey: ["dashboard", "attendants-load"],
    queryFn: api.getAttendantsLoad
  });

  const online = attendantsLoad.data?.filter((item) => item.isOnline).length ?? 0;
  const full =
    attendantsLoad.data?.filter(
      (item) => item.currentLoad >= item.maxConcurrentAttendances
    ).length ?? 0;

  return (
    <main className="grid gap-3 px-4 py-3 sm:px-5 xl:px-6">
      <PageHeader
        eyebrow="Workforce"
        title="Atendentes"
        description="Controle disponibilidade, ocupacao e distribuicao da equipe por time."
      />

      <section className="grid gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AttendantsPanel
          attendants={attendantsLoad.data}
          loading={attendantsLoad.isLoading}
        />
        <div className="grid gap-3">
          <LoadChart
            data={attendantsLoad.data}
            loading={attendantsLoad.isLoading}
          />
          <DashboardPanel
            title="Resumo da equipe"
            eyebrow="Capacidade"
            icon={<UsersRound className="h-4 w-4" />}
            compact
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <TeamMetric label="Online" value={online} variant="success" />
              <TeamMetric label="Lotados" value={full} variant="warning" />
              <TeamMetric
                label="Total"
                value={attendantsLoad.data?.length ?? 0}
                variant="primary"
              />
            </div>
            <div className="mt-4 grid gap-2">
              {attendantsLoad.data?.slice(0, 6).map((attendant) => (
                <div
                  key={attendant.attendantId}
                  className="flex items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                >
                  <span className="truncate font-semibold">{attendant.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {displayTeamName(attendant.teamName, attendant.teamType)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs tabular-nums">
                    <Gauge className="h-3.5 w-3.5 text-primary" />
                    {attendant.currentLoad}/{attendant.maxConcurrentAttendances}
                  </span>
                </div>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </section>
    </main>
  );
}

function TeamMetric({
  label,
  value,
  variant
}: {
  label: string;
  value: number;
  variant: "success" | "warning" | "primary";
}) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Badge variant={variant}>{label}</Badge>
      </div>
      <div className="mt-2 text-3xl font-black tabular-nums">{value}</div>
    </div>
  );
}
