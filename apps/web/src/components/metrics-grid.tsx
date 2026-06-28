import type { DashboardSummaryDto } from "@flowpay/shared";
import type { ComponentType } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Gauge,
  Headphones,
  ListTodo,
  UsersRound
} from "lucide-react";
import { formatPercent, formatSeconds } from "../lib/utils";
import { MetricCard } from "./metric-card";
import { Skeleton } from "./ui/skeleton";

interface Metric {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  trend: string;
  tone: "primary" | "accent" | "success" | "warning" | "violet";
}

export function MetricsGrid({
  summary,
  loading
}: {
  summary?: DashboardSummaryDto;
  loading: boolean;
}) {
  if (loading || !summary) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-[96px]" />
        ))}
      </div>
    );
  }

  const metrics: Metric[] = [
    {
      label: "Total",
      value: summary.totalAttendances,
      icon: Activity,
      trend: "volume acumulado",
      tone: "primary"
    },
    {
      label: "Em atendimento",
      value: summary.inProgress,
      icon: Headphones,
      trend: `${formatPercent(summary.capacityUtilization)} da capacidade`,
      tone: "accent"
    },
    {
      label: "Na fila",
      value: summary.queued,
      icon: ListTodo,
      trend: summary.queued > 0 ? "atencao operacional" : "fila controlada",
      tone: "warning"
    },
    {
      label: "Finalizados",
      value: summary.finished,
      icon: CheckCircle2,
      trend: "concluidos no ciclo",
      tone: "success"
    },
    {
      label: "Online",
      value: summary.onlineAttendants,
      icon: UsersRound,
      trend: "equipe disponivel",
      tone: "accent"
    },
    {
      label: "Capacidade",
      value: `${summary.usedCapacity}/${summary.totalCapacity}`,
      icon: Gauge,
      trend: "slots simultaneos",
      tone: "violet"
    },
    {
      label: "Uso",
      value: formatPercent(summary.capacityUtilization),
      icon: Gauge,
      trend: "ocupação agora",
      tone: "warning"
    },
    {
      label: "Espera media",
      value: formatSeconds(summary.averageWaitSeconds),
      icon: Clock3,
      trend: "tempo medio de entrada",
      tone: "primary"
    }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          trend={metric.trend}
          Icon={metric.icon}
          tone={metric.tone}
        />
      ))}
    </div>
  );
}
