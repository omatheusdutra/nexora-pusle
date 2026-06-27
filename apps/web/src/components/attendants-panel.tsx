import type { AttendantLoadDto } from "@flowpay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UsersRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { AgentCard } from "./agent-card";
import { DashboardPanel } from "./dashboard-panel";
import { Skeleton } from "./ui/skeleton";

export function AttendantsPanel({
  attendants,
  loading
}: {
  attendants?: AttendantLoadDto[];
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      id,
      isOnline
    }: {
      id: string;
      isOnline: boolean;
    }) => api.updateAttendantStatus(id, isOnline),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["attendants"] });
      toast.success("Status atualizado");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar");
    }
  });

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <DashboardPanel
      title="Atendentes"
      eyebrow="Workforce"
      icon={<UsersRound className="h-4 w-4" />}
      live
    >
      <div className="grid max-h-[430px] gap-3 overflow-y-auto pr-1 nexora-scrollbar">
        {attendants?.length ? (
          attendants.map((attendant) => (
            <AgentCard
              key={attendant.attendantId}
              attendant={attendant}
              disabled={mutation.isPending}
              onToggle={() =>
                mutation.mutate({
                  id: attendant.attendantId,
                  isOnline: !attendant.isOnline
                })
              }
            />
          ))
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum atendente cadastrado
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
