import type { AttendanceDto, TeamType } from "@flowpay/shared";
import { useQuery } from "@tanstack/react-query";
import { PieChartIcon } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { api } from "../lib/api";
import { displayTeamName, teamTone } from "../lib/utils";
import { DashboardPanel } from "./dashboard-panel";
import { Skeleton } from "./ui/skeleton";

const teamOrder: TeamType[] = ["CARDS", "LOANS", "OTHER"];

function resolveTeamType(attendance: AttendanceDto): TeamType {
  return attendance.team?.type ?? "OTHER";
}

export function TeamDistributionChart() {
  const attendances = useQuery({
    queryKey: ["attendances", "distribution"],
    queryFn: () => api.listAttendances({ pageSize: 100 })
  });

  if (attendances.isLoading) {
    return <Skeleton className="h-[252px]" />;
  }

  const counts = new Map<TeamType, number>(
    teamOrder.map((teamType) => [teamType, 0])
  );

  for (const attendance of attendances.data?.data ?? []) {
    const teamType = resolveTeamType(attendance);
    counts.set(teamType, (counts.get(teamType) ?? 0) + 1);
  }

  const chartData = teamOrder.map((teamType) => {
    const teamName = displayTeamName("", teamType);
    const tone = teamTone(teamName, teamType);

    return {
      teamType,
      name:
        teamType === "CARDS"
          ? "Cartões"
          : teamType === "LOANS"
            ? "Empréstimos"
            : "Outros Assuntos",
      fullName: teamName,
      value: counts.get(teamType) ?? 0,
      color: tone.chart,
      tone
    };
  });
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const chartTotal = Math.max(total, 1);

  return (
    <DashboardPanel
      title="Distribuição por time"
      eyebrow="Mix operacional"
      icon={<PieChartIcon className="h-4 w-4" />}
      live
    >
      <div className="grid gap-4 sm:grid-cols-[160px_1fr] xl:grid-cols-1 2xl:grid-cols-[160px_1fr]">
        <div className="relative h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.map((item) => ({
                  ...item,
                  value: item.value || (total === 0 ? chartTotal / 3 : 0)
                }))}
                dataKey="value"
                nameKey="name"
                innerRadius={47}
                outerRadius={70}
                paddingAngle={4}
                stroke="hsl(var(--background))"
                strokeWidth={3}
              >
                {chartData.map((item) => (
                  <Cell
                    key={item.teamType}
                    fill={item.value > 0 ? item.color : "hsl(var(--muted))"}
                    opacity={item.value > 0 ? 0.95 : 0.28}
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
              <div className="text-2xl font-semibold tabular-nums">{total}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Total
              </div>
            </div>
          </div>
        </div>

        <div className="grid content-center gap-2">
          {chartData.map((item) => (
            <div
              key={item.teamType}
              className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${item.tone.dot}`} />
                <span className="truncate">{item.name}</span>
              </div>
              <span className="font-semibold tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardPanel>
  );
}
