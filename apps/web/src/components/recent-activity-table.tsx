import type { RecentActivityDto } from "@flowpay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Check, Clock3, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { cn, displayTeamName, initialsFor, teamTone } from "../lib/utils";
import { DashboardPanel } from "./dashboard-panel";
import { StatusBadge } from "./status-badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export function RecentActivityTable({
  rows,
  loading
}: {
  rows?: RecentActivityDto[];
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "finish" | "cancel" }) =>
      action === "finish" ? api.finishAttendance(id) : api.cancelAttendance(id),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["attendants"] });
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Falha na ação");
    }
  });

  if (loading) {
    return <Skeleton className="h-[360px]" />;
  }

  return (
    <DashboardPanel
      title="Atendimentos recentes"
      eyebrow="Live feed"
      icon={<Clock3 className="h-4 w-4" />}
      live
      compact
      action={
        <Button variant="outline" size="sm" className="h-8 rounded-md text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
        </Button>
      }
    >
        {rows?.length ? (
          <div className="max-h-[360px] overflow-auto rounded-lg border border-border bg-background/50 nexora-scrollbar dark:border-white/10 dark:bg-black/12">
            <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface-strong text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-xl dark:bg-[#071426]/95">
                  <th className="border-b border-border px-3 py-2.5 font-semibold dark:border-white/10">
                    Cliente
                  </th>
                  <th className="border-b border-border px-3 py-2.5 font-semibold dark:border-white/10">
                    Assunto
                  </th>
                  <th className="border-b border-border px-3 py-2.5 font-semibold dark:border-white/10">
                    Time
                  </th>
                  <th className="border-b border-border px-3 py-2.5 font-semibold dark:border-white/10">
                    Atendente
                  </th>
                  <th className="border-b border-border px-3 py-2.5 font-semibold dark:border-white/10">
                    Status
                  </th>
                  <th className="border-b border-border px-3 py-2.5 text-right font-semibold dark:border-white/10">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const tone = teamTone(row.teamName);

                  return (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-background/65 dark:hover:bg-white/5"
                  >
                    <td className="border-b border-border/70 px-3 py-2.5 dark:border-white/8">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-gradient-to-br from-primary/22 via-violet/14 to-accent/18 text-xs font-semibold text-foreground shadow-glow dark:border-white/10">
                          {initialsFor(row.customerName)}
                        </div>
                        <div className="min-w-0">
                          <div className="max-w-52 truncate font-semibold leading-5">
                            {row.customerName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            #{row.id.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-border/70 px-3 py-2.5 dark:border-white/8">
                      <div className="max-w-64 truncate text-muted-foreground">
                        {row.subject}
                      </div>
                    </td>
                    <td className="border-b border-border/70 px-3 py-2.5 dark:border-white/8">
                      <div className="flex max-w-44 items-center gap-2 truncate">
                        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", tone.dot)} />
                        {displayTeamName(row.teamName)}
                      </div>
                    </td>
                    <td className="border-b border-border/70 px-3 py-2.5 text-muted-foreground dark:border-white/8">
                      {row.attendantName ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-background/70 text-[11px] font-semibold text-foreground dark:border-white/10 dark:bg-white/8">
                            {initialsFor(row.attendantName)}
                          </span>
                          <span className="max-w-36 truncate">
                            {row.attendantName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Em fila</span>
                      )}
                    </td>
                    <td className="border-b border-border/70 px-3 py-2.5 dark:border-white/8">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="border-b border-border/70 px-3 py-2.5 text-right dark:border-white/8">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Finalizar"
                          aria-label="Finalizar"
                          className="h-8 w-8 rounded-full border border-success/20 bg-success/8 text-success hover:bg-success/12"
                          disabled={
                            row.status !== "IN_PROGRESS" || mutation.isPending
                          }
                          onClick={() =>
                            mutation.mutate({ id: row.id, action: "finish" })
                          }
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Cancelar"
                          aria-label="Cancelar"
                          className="h-8 w-8 rounded-full border border-destructive/20 bg-destructive/8 text-destructive hover:bg-destructive/12"
                          disabled={
                            !["IN_PROGRESS", "QUEUED"].includes(row.status) ||
                            mutation.isPending
                          }
                          onClick={() =>
                            mutation.mutate({ id: row.id, action: "cancel" })
                          }
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum atendimento criado
          </div>
        )}
    </DashboardPanel>
  );
}
