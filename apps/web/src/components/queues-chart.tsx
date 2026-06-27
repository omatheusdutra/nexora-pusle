import type { QueueMetricDto } from "@flowpay/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ListTodo } from "lucide-react";
import { displayTeamName } from "../lib/utils";
import { DashboardPanel } from "./dashboard-panel";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./ui/skeleton";

export function QueuesChart({
  data,
  loading
}: {
  data?: QueueMetricDto[];
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-80" />;
  }

  const chartData =
    data?.map((item) => ({
      team: displayTeamName(item.teamName, item.teamType),
      queued: item.queued
    })) ?? [];
  const hasQueue = chartData.some((item) => item.queued > 0);
  const maxQueue = Math.max(1, ...chartData.map((item) => item.queued));

  return (
    <DashboardPanel
      title="Fila por time"
      eyebrow="Roteamento"
      icon={<ListTodo className="h-4 w-4" />}
      className="min-h-80"
    >
      <div className="grid gap-5">
        <div className="grid gap-3">
          {chartData.map((item) => (
            <div key={item.team} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{item.team}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {item.queued} na fila
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-sm border border-white/8 bg-white/8">
                <div
                  className="h-full rounded-sm bg-gradient-to-r from-primary via-violet to-accent transition-all duration-500"
                  style={{
                    width: `${Math.max(4, (item.queued / maxQueue) * 100)}%`,
                    opacity: item.queued > 0 ? 1 : 0.28
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {hasQueue ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="queueGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.22}
                />
                <XAxis
                  dataKey="team"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8
                  }}
                />
                <Bar
                  dataKey="queued"
                  name="Na fila"
                  fill="url(#queueGradient)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState label="Nenhum atendimento aguardando" />
        )}
      </div>
    </DashboardPanel>
  );
}
