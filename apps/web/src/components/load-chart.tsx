import type { AttendantLoadDto } from "@flowpay/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Gauge } from "lucide-react";
import { displayTeamName } from "../lib/utils";
import { DashboardPanel } from "./dashboard-panel";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./ui/skeleton";

function loadColor(load: number, max: number) {
  const percent = max > 0 ? (load / max) * 100 : 0;

  if (percent >= 100) return "url(#loadHigh)";
  if (percent >= 67) return "url(#loadMedium)";
  return "url(#loadLow)";
}

export function LoadChart({
  data,
  loading
}: {
  data?: AttendantLoadDto[];
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-[266px]" />;
  }

  const chartData =
    data?.map((item) => ({
      name: item.name.split(" ")[0],
      carga: item.currentLoad,
      max: item.maxConcurrentAttendances,
      team: displayTeamName(item.teamName, item.teamType)
    })) ?? [];
  const maxCapacity = Math.max(3, ...chartData.map((item) => item.max));

  return (
    <DashboardPanel
      title="Carga dos atendentes"
      eyebrow="Capacidade"
      icon={<Gauge className="h-4 w-4" />}
      className="min-h-[266px]"
      live
      compact
    >
        {chartData.length ? (
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-accent/25 bg-accent/10 px-2 py-1">
                Baixa
              </span>
              <span className="rounded-full border border-warning/25 bg-warning/10 px-2 py-1">
                Media
              </span>
              <span className="rounded-full border border-destructive/25 bg-destructive/10 px-2 py-1">
                Alta
              </span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 10, left: 0, bottom: 0 }}
                >
                <defs>
                  <linearGradient id="loadLow" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.72} />
                    <stop offset="100%" stopColor="hsl(var(--success))" />
                  </linearGradient>
                  <linearGradient id="loadMedium" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--violet))" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="hsl(var(--warning))" />
                  </linearGradient>
                  <linearGradient id="loadHigh" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--warning))" />
                    <stop offset="100%" stopColor="hsl(var(--destructive))" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--border))"
                  opacity={0.28}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  domain={[0, maxCapacity]}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={58}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--foreground))"
                  }}
                />
                <Bar
                  dataKey="carga"
                  name="Carga atual"
                  radius={[0, 8, 8, 0]}
                  barSize={12}
                >
                  {chartData.map((item) => (
                    <Cell
                      key={`${item.name}-${item.team}`}
                      fill={loadColor(item.carga, item.max)}
                    />
                  ))}
                </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <EmptyState label="Sem carga para exibir" />
        )}
    </DashboardPanel>
  );
}
