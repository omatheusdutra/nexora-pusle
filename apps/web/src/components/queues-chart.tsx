import type { QueueMetricDto } from "@flowpay/shared";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { ListTodo } from "lucide-react";
import { displayTeamName, teamTone } from "../lib/utils";
import { DashboardPanel } from "./dashboard-panel";
import { Skeleton } from "./ui/skeleton";

export function QueuesChart({
  data,
  loading
}: {
  data?: QueueMetricDto[];
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-[266px]" />;
  }

  const chartData =
    data?.map((item) => {
      const team = displayTeamName(item.teamName, item.teamType);
      const tone = teamTone(item.teamName, item.teamType);

      return {
        team,
        teamType: item.teamType,
        queued: item.queued,
        color: tone.chart,
        tone
      };
    }) ?? [];
  const totalQueued = chartData.reduce((sum, item) => sum + item.queued, 0);
  const maxQueue = Math.max(1, ...chartData.map((item) => item.queued));
  const ringData = chartData.map((item) => ({
    ...item,
    value: item.queued || (totalQueued === 0 ? 1 : 0)
  }));

  return (
    <DashboardPanel
      title="Fila por time"
      eyebrow="Roteamento"
      icon={<ListTodo className="h-4 w-4" />}
      className="min-h-[266px]"
      live
      compact
    >
      <div className="grid gap-3 sm:grid-cols-[160px_1fr] xl:grid-cols-1 2xl:grid-cols-[170px_1fr]">
        <div className="relative h-40">
          <div className="absolute inset-3 rounded-full border border-primary/10 bg-primary/5 blur-[1px]" />
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ringData}
                dataKey="value"
                nameKey="team"
                innerRadius={49}
                outerRadius={72}
                paddingAngle={5}
                stroke="hsl(var(--background))"
                strokeWidth={3}
              >
                {ringData.map((item) => (
                  <Cell
                    key={item.teamType}
                    fill={totalQueued > 0 ? item.color : "hsl(var(--muted))"}
                    opacity={totalQueued > 0 && item.queued === 0 ? 0.22 : 0.9}
                  />
                ))}
              </Pie>
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-4xl font-black tabular-nums">
                {totalQueued}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Na fila
              </div>
            </div>
          </div>
        </div>

        <div className="grid content-center gap-2.5">
          {chartData.map((item) => (
            <div key={item.team} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.tone.dot}`} />
                  <span className="truncate">{item.team}</span>
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {item.queued} na fila
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full border border-border bg-muted shadow-inset dark:border-white/8 dark:bg-white/8">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(4, (item.queued / maxQueue) * 100)}%`,
                    opacity: item.queued > 0 ? 1 : 0.26,
                    background: `linear-gradient(90deg, ${item.color}, hsl(var(--accent)))`,
                    boxShadow:
                      item.queued > 0 ? `0 0 18px -8px ${item.color}` : "none"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardPanel>
  );
}
