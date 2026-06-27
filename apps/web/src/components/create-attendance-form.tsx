import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Landmark, Send, Sparkles, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  createAttendanceSchema,
  SUBJECT_MATCHERS,
  type CreateAttendanceInput
} from "@flowpay/shared";
import { toast } from "sonner";
import { api } from "../lib/api";
import { professionalSubjects } from "../lib/utils";
import { DashboardPanel } from "./dashboard-panel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const routePresets = [
  {
    label: "Cartões",
    subject: SUBJECT_MATCHERS.CARDS,
    Icon: CreditCard
  },
  {
    label: "Crédito",
    subject: SUBJECT_MATCHERS.LOANS,
    Icon: Landmark
  },
  {
    label: "Geral",
    subject: "Atualizacao cadastral",
    Icon: UserRound
  }
];

export function CreateAttendanceForm() {
  const queryClient = useQueryClient();
  const form = useForm<CreateAttendanceInput>({
    resolver: zodResolver(createAttendanceSchema),
    defaultValues: {
      customerName: "",
      subject: SUBJECT_MATCHERS.CARDS
    }
  });
  const mutation = useMutation({
    mutationFn: api.createAttendance,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["attendants"] });
      void queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success(
        result.result === "QUEUED"
          ? "Atendimento entrou na fila"
          : "Atendimento atribuído"
      );
      form.reset({
        customerName: "",
        subject: form.getValues("subject")
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Falha ao criar");
    }
  });

  return (
    <DashboardPanel
      title="Novo atendimento"
      eyebrow="Entrada assistida"
      icon={<Sparkles className="h-4 w-4" />}
      live
    >
      <form
        className="grid gap-3"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="grid grid-cols-3 gap-2">
          {routePresets.map((preset) => {
            const Icon = preset.Icon;
            const active = form.watch("subject") === preset.subject;

            return (
              <button
                key={preset.label}
                type="button"
                className={`grid h-12 place-items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold transition-all ${
                  active
                    ? "border-primary/40 bg-primary/15 text-primary shadow-glow"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/8 hover:text-foreground"
                }`}
                onClick={() =>
                  form.setValue("subject", preset.subject, {
                    shouldDirty: true,
                    shouldValidate: true
                  })
                }
              >
                <Icon className="h-4 w-4" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Cliente
          <Input
            className="h-9 text-sm font-normal normal-case tracking-normal text-foreground"
            placeholder="Marina Teixeira"
            autoComplete="off"
            {...form.register("customerName")}
          />
          {form.formState.errors.customerName ? (
            <span className="text-xs text-destructive">
              {form.formState.errors.customerName.message}
            </span>
          ) : null}
        </label>

        <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Assunto
          <Input
            className="h-9 text-sm font-normal normal-case tracking-normal text-foreground"
            list="nexora-subjects"
            placeholder="Selecione ou descreva o assunto"
            autoComplete="off"
            {...form.register("subject")}
          />
          <datalist id="nexora-subjects">
            {professionalSubjects.map((subject) => (
              <option key={subject} value={subject} />
            ))}
          </datalist>
          {form.formState.errors.subject ? (
            <span className="text-xs text-destructive">
              {form.formState.errors.subject.message}
            </span>
          ) : null}
        </label>

        <Button type="submit" disabled={mutation.isPending} className="mt-1 w-full">
          {mutation.isPending ? (
            <Sparkles className="h-4 w-4 animate-pulse" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {mutation.isPending ? "Roteando..." : "Criar atendimento"}
        </Button>
      </form>
    </DashboardPanel>
  );
}
