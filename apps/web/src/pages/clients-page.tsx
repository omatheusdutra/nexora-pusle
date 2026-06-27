import type { AttendanceDto, AttendanceStatus } from "@flowpay/shared";
import { useQuery } from "@tanstack/react-query";
import { Building2, Clock3, UserRoundCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { DashboardPanel } from "../components/dashboard-panel";
import { PageHeader } from "../components/page-header";
import { StatusBadge } from "../components/status-badge";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { displayTeamName, initialsFor } from "../lib/utils";

interface CustomerInsight {
  name: string;
  total: number;
  lastStatus: AttendanceStatus;
  lastSubject: string;
  lastTeam: string;
  updatedAt: string;
}

export function ClientsPage() {
  const attendances = useQuery({
    queryKey: ["attendances", "clients"],
    queryFn: () => api.listAttendances({ pageSize: 100 })
  });

  const customers = buildCustomerInsights(attendances.data?.data ?? []);
  const activeCustomers = customers.filter((customer) =>
    ["QUEUED", "IN_PROGRESS"].includes(customer.lastStatus)
  ).length;

  return (
    <main className="grid gap-3 px-4 py-3 sm:px-5 xl:px-6">
      <PageHeader
        eyebrow="Relacionamento"
        title="Clientes"
        description="Carteira operacional com clientes recentes, ultimo assunto e status de atendimento."
      />

      <section className="grid gap-3 md:grid-cols-3">
        <ClientMetric
          icon={<UsersRound className="h-4 w-4" />}
          label="Clientes unicos"
          value={customers.length}
        />
        <ClientMetric
          icon={<UserRoundCheck className="h-4 w-4" />}
          label="Em ciclo ativo"
          value={activeCustomers}
        />
        <ClientMetric
          icon={<Clock3 className="h-4 w-4" />}
          label="Registros analisados"
          value={attendances.data?.total ?? 0}
        />
      </section>

      <DashboardPanel
        title="Carteira recente"
        eyebrow="Clientes"
        icon={<Building2 className="h-4 w-4" />}
        compact
      >
        {attendances.isLoading ? (
          <Skeleton className="h-[420px]" />
        ) : customers.length ? (
          <div className="grid gap-2">
            {customers.map((customer) => (
              <div
                key={customer.name}
                className="grid gap-3 rounded-lg border border-border bg-background/60 p-3 shadow-inset transition-colors hover:border-primary/25 hover:bg-card dark:border-white/10 dark:bg-white/5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-primary/20 bg-primary/10 text-xs font-black text-primary">
                    {initialsFor(customer.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">
                      {customer.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {customer.lastSubject}
                    </div>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span className="truncate">{customer.lastTeam}</span>
                </div>
                <div className="flex items-center justify-between gap-2 md:justify-end">
                  <Badge variant="neutral">{customer.total} chamados</Badge>
                  <StatusBadge status={customer.lastStatus} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}

function ClientMetric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="nexora-panel rounded-lg p-3">
      <div className="nexora-content flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-black tabular-nums">{value}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-md border border-primary/20 bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

function buildCustomerInsights(rows: AttendanceDto[]): CustomerInsight[] {
  const customers = new Map<string, CustomerInsight>();

  for (const attendance of rows) {
    const current = customers.get(attendance.customerName);
    const lastTeam = displayTeamName(attendance.team.name, attendance.team.type);

    if (!current || attendance.updatedAt > current.updatedAt) {
      customers.set(attendance.customerName, {
        name: attendance.customerName,
        total: (current?.total ?? 0) + 1,
        lastStatus: attendance.status,
        lastSubject: attendance.subject,
        lastTeam,
        updatedAt: attendance.updatedAt
      });
    } else {
      current.total += 1;
    }
  }

  return [...customers.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}
