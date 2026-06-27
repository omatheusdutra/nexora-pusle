import type { AttendanceStatus } from "@flowpay/shared";
import { useQuery } from "@tanstack/react-query";
import { Filter, PlusCircle } from "lucide-react";
import { useState } from "react";
import { CreateAttendanceForm } from "../components/create-attendance-form";
import { DashboardPanel } from "../components/dashboard-panel";
import { PageHeader } from "../components/page-header";
import { StatusBadge } from "../components/status-badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { displayTeamName, initialsFor } from "../lib/utils";

const statusOptions: Array<{ label: string; value?: AttendanceStatus }> = [
  { label: "Todos" },
  { label: "Fila", value: "QUEUED" },
  { label: "Em atendimento", value: "IN_PROGRESS" },
  { label: "Finalizados", value: "FINISHED" },
  { label: "Cancelados", value: "CANCELLED" }
];

export function AttendancesPage() {
  const [status, setStatus] = useState<AttendanceStatus | undefined>();
  const attendances = useQuery({
    queryKey: ["attendances", "page", status],
    queryFn: () => api.listAttendances({ status, pageSize: 40 })
  });

  return (
    <main className="grid gap-3 px-4 py-3 sm:px-5 xl:px-6">
      <PageHeader
        eyebrow="Operacao"
        title="Atendimentos"
        description="Acompanhe a esteira completa de clientes, status, times e responsaveis em tempo real."
        action={
          <Button variant="outline" size="sm">
            <PlusCircle className="h-4 w-4" />
            Novo fluxo
          </Button>
        }
      />

      <section className="grid gap-3 xl:grid-cols-[310px_minmax(0,1fr)]">
        <CreateAttendanceForm />

        <DashboardPanel
          title="Esteira de atendimentos"
          eyebrow="Live operations"
          icon={<Filter className="h-4 w-4" />}
          live
          compact
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  status === option.value
                    ? "border-primary/35 bg-primary/12 text-primary"
                    : "border-border bg-background/60 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/5"
                }`}
                onClick={() => setStatus(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {attendances.isLoading ? (
            <Skeleton className="h-[440px]" />
          ) : (
            <div className="max-h-[520px] overflow-auto rounded-lg border border-border bg-background/50 nexora-scrollbar dark:border-white/10 dark:bg-black/12">
              <table className="w-full min-w-[840px] border-separate border-spacing-0 text-sm">
                <thead className="sticky top-0 z-10 bg-surface-strong text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-xl dark:bg-[#071426]/95">
                  <tr>
                    <th className="border-b border-border px-3 py-2.5 dark:border-white/10">Cliente</th>
                    <th className="border-b border-border px-3 py-2.5 dark:border-white/10">Assunto</th>
                    <th className="border-b border-border px-3 py-2.5 dark:border-white/10">Time</th>
                    <th className="border-b border-border px-3 py-2.5 dark:border-white/10">Atendente</th>
                    <th className="border-b border-border px-3 py-2.5 dark:border-white/10">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.data?.data.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-background/65 dark:hover:bg-white/5">
                      <td className="border-b border-border/70 px-3 py-2.5 dark:border-white/8">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 place-items-center rounded-md border border-primary/20 bg-primary/12 text-xs font-black">
                            {initialsFor(attendance.customerName)}
                          </span>
                          <span className="font-semibold">
                            {attendance.customerName}
                          </span>
                        </div>
                      </td>
                      <td className="border-b border-border/70 px-3 py-2.5 text-muted-foreground dark:border-white/8">
                        {attendance.subject}
                      </td>
                      <td className="border-b border-border/70 px-3 py-2.5 dark:border-white/8">
                        {displayTeamName(attendance.team.name, attendance.team.type)}
                      </td>
                      <td className="border-b border-border/70 px-3 py-2.5 text-muted-foreground dark:border-white/8">
                        {attendance.attendant?.name ?? "Em fila"}
                      </td>
                      <td className="border-b border-border/70 px-3 py-2.5 dark:border-white/8">
                        <StatusBadge status={attendance.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardPanel>
      </section>
    </main>
  );
}
