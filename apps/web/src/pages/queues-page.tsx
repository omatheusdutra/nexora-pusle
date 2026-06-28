import { useQuery } from "@tanstack/react-query";
import { Clock3, RadioTower, Route } from "lucide-react";
import { DashboardPanel } from "../components/dashboard-panel";
import { PageHeader } from "../components/page-header";
import { QueuesChart } from "../components/queues-chart";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { displayTeamName, teamTone } from "../lib/utils";

export function QueuesPage() {
  const queues = useQuery({
    queryKey: ["dashboard", "queues"],
    queryFn: api.getQueues
  });

  return (
    <main className="grid gap-3 px-4 py-3 sm:px-5 xl:px-6">
      <PageHeader
        eyebrow="Roteamento"
        title="Fila & Rotas"
        description="Visualize pressao por time, prioridade operacional e disponibilidade de roteamento."
      />

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <QueuesChart data={queues.data} loading={queues.isLoading} />
        <DashboardPanel
          title="Sinal de tempo real"
          eyebrow="Stream"
          icon={<RadioTower className="h-4 w-4" />}
          live
          compact
        >
          <div className="grid gap-3">
            <div className="rounded-lg border border-success/20 bg-success/10 p-4">
              <div className="flex items-center gap-2 text-success">
                <span className="pulse-dot h-2 w-2 rounded-full bg-current" />
                <span className="text-sm font-bold">Fila sincronizada</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Eventos de fila, atribuição e reatribuição atualizam o painel
                sem refresh.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Metric label="Rotas" value={queues.data?.length ?? 0} />
              <Metric
                label="Na fila"
                value={queues.data?.reduce((sum, item) => sum + item.queued, 0) ?? 0}
              />
            </div>
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        {queues.isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-44" />
            ))
          : queues.data?.map((queue) => {
              const tone = teamTone(queue.teamName, queue.teamType);
              return (
                <DashboardPanel
                  key={queue.teamId}
                  title={displayTeamName(queue.teamName, queue.teamType)}
                  eyebrow="Fila operacional"
                  icon={<Route className="h-4 w-4" />}
                  compact
                >
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-4xl font-black tabular-nums">
                        {queue.queued}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        clientes aguardando
                      </div>
                    </div>
                    <Badge variant={queue.queued > 0 ? "warning" : "success"}>
                      {queue.queued > 0 ? "Atenção" : "Controlado"}
                    </Badge>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted dark:bg-white/8">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(12, queue.queued * 20))}%`,
                        background: tone.chart
                      }}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    Mais antigo: {queue.oldestQueuedAt ? "em monitoramento" : "sem fila"}
                  </div>
                </DashboardPanel>
              );
            })}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black tabular-nums">{value}</div>
    </div>
  );
}
