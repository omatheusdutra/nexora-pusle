import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  updateOwnProfileSchema,
  type UpdateOwnProfileInput
} from "@flowpay/shared";
import { useAuth } from "../auth/auth-context";
import { DashboardPanel } from "../components/dashboard-panel";
import { PageHeader } from "../components/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { api } from "../lib/api";

const roleLabels = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor"
} as const;

export function ProfilePage() {
  const { user, updateSessionUser } = useAuth();
  const form = useForm<UpdateOwnProfileInput>({
    resolver: zodResolver(updateOwnProfileSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: ""
    }
  });

  useEffect(() => {
    form.reset({
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: ""
    });
  }, [form, user?.email, user?.name]);

  const mutation = useMutation({
    mutationFn: api.updateCurrentUser,
    onSuccess: ({ user: updatedUser }) => {
      updateSessionUser(updatedUser);
      form.reset({
        name: updatedUser.name,
        email: updatedUser.email,
        password: ""
      });
      toast.success("Perfil atualizado");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Falha ao atualizar perfil"
      );
    }
  });

  return (
    <main className="grid gap-3 px-4 py-3 sm:px-5 xl:px-6">
      <PageHeader
        eyebrow="Conta"
        title="Meu perfil"
        description="Atualize seus dados de acesso da Nexora Pulse com segurança."
        action={
          <Badge variant="primary">
            {user ? roleLabels[user.role] : "Perfil"}
          </Badge>
        }
      />

      <section className="grid gap-3 xl:grid-cols-[minmax(0,640px)_minmax(280px,1fr)]">
        <DashboardPanel
          title="Dados do perfil"
          eyebrow="Sessão autenticada"
          icon={<UserRound className="h-4 w-4" />}
          compact
        >
          <form
            className="grid gap-3"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Nome
              <span className="relative block">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 pl-9 text-sm font-normal normal-case tracking-normal text-foreground"
                  autoComplete="name"
                  placeholder="Seu nome"
                  {...form.register("name")}
                />
              </span>
              {form.formState.errors.name ? (
                <span className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </span>
              ) : null}
            </label>

            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              E-mail
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 pl-9 text-sm font-normal normal-case tracking-normal text-foreground"
                  autoComplete="email"
                  placeholder="usuario@nexora.local"
                  {...form.register("email")}
                />
              </span>
              {form.formState.errors.email ? (
                <span className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </span>
              ) : null}
            </label>

            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Nova senha
              <span className="relative block">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 pl-9 text-sm font-normal normal-case tracking-normal text-foreground"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Deixe em branco para manter a atual"
                  {...form.register("password")}
                />
              </span>
              {form.formState.errors.password ? (
                <span className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </span>
              ) : null}
            </label>

            <Button type="submit" disabled={mutation.isPending} className="mt-1">
              {mutation.isPending ? (
                <Save className="h-4 w-4 animate-pulse" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mutation.isPending ? "Salvando..." : "Salvar perfil"}
            </Button>
          </form>
        </DashboardPanel>

        <DashboardPanel
          title="Permissões"
          eyebrow="RBAC"
          icon={<ShieldCheck className="h-4 w-4" />}
          compact
        >
          <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <div className="rounded-md border border-primary/15 bg-primary/8 p-3">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Perfil atual
              </div>
              <div className="mt-2 text-base font-bold text-foreground">
                {user ? roleLabels[user.role] : "Usuário"}
              </div>
            </div>
            <p>
              Administradores podem gerenciar todos os perfis. Supervisores
              podem atualizar apenas a própria conta.
            </p>
          </div>
        </DashboardPanel>
      </section>
    </main>
  );
}
