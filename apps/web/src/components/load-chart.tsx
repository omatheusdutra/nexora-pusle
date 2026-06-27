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

  if (percent >= 100) return "hsl(var(--destructive))";
  if (percent >= 67) return "hsl(var(--warning))";
  return "hsl(var(--accent))";
}

export function LoadChart({
  data,
  loading
}: {
  data?: AttendantLoadDto[];
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-80" />;
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
      className="min-h-80"
    >
        {chartData.length ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-sm border border-accent/25 bg-accent/10 px-2 py-1">
                Baixa
              </span>
              <span className="rounded-sm border border-warning/25 bg-warning/10 px-2 py-1">
                Média
              </span>
              <span className="rounded-sm border border-destructive/25 bg-destructive/10 px-2 py-1">
                Alta
              </span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 18, left: 8, bottom: 0 }}
                >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  opacity={0.22}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  domain={[0, maxCapacity]}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={62}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8
                  }}
                />
                <Bar dataKey="carga" name="Carga atual" radius={[0, 6, 6, 0]}>
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
