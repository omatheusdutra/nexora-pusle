import type { RecentActivityDto } from "@flowpay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Check, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { displayTeamName, initialsFor } from "../lib/utils";
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
      toast.error(error instanceof Error ? error.message : "Falha na acao");
    }
  });

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <DashboardPanel
      title="Atendimentos recentes"
      eyebrow="Live feed"
      icon={<Clock3 className="h-4 w-4" />}
    >
        {rows?.length ? (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[880px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-white/5 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="border-b border-white/10 px-4 py-3 font-semibold">
                    Cliente
                  </th>
                  <th className="border-b border-white/10 px-4 py-3 font-semibold">
                    Assunto
                  </th>
                  <th className="border-b border-white/10 px-4 py-3 font-semibold">
                    Time
                  </th>
                  <th className="border-b border-white/10 px-4 py-3 font-semibold">
                    Atendente
                  </th>
                  <th className="border-b border-white/10 px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th className="border-b border-white/10 px-4 py-3 text-right font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/8 transition-colors last:border-0 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 bg-primary/12 text-xs font-semibold text-primary">
                          {initialsFor(row.customerName)}
                        </div>
                        <div className="min-w-0">
                          <div className="max-w-52 truncate font-semibold">
                            {row.customerName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            #{row.id.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-64 truncate text-muted-foreground">
                        {row.subject}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-44 truncate">
                        {displayTeamName(row.teamName)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.attendantName ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-white/8 text-[11px] font-semibold text-foreground">
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
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Finalizar"
                          aria-label="Finalizar"
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
                ))}
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
