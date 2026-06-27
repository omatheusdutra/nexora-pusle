import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Mail, ShieldCheck, UserPlus, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { createUserSchema, type AuthUserDto, type CreateUserInput } from "@flowpay/shared";
import { useAuth } from "../auth/auth-context";
import { DashboardPanel } from "../components/dashboard-panel";
import { PageHeader } from "../components/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { api } from "../lib/api";

export function UsersPage() {
  const { user } = useAuth();
  const [createdUser, setCreatedUser] = useState<AuthUserDto | null>(null);
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "SUPERVISOR"
    }
  });
  const mutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: ({ user: created }) => {
      setCreatedUser(created);
      toast.success("Supervisor cadastrado");
      form.reset({
        name: "",
        email: "",
        password: "",
        role: "SUPERVISOR"
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Falha ao cadastrar supervisor"
      );
    }
  });

  if (user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="grid gap-3 px-4 py-3 sm:px-5 xl:px-6">
      <PageHeader
        eyebrow="Administração"
        title="Usuários"
        description="Cadastre supervisores operacionais para acessar o command center com sessão segura."
        action={<Badge variant="primary">ADMIN</Badge>}
      />

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardPanel
          title="Novo supervisor"
          eyebrow="Controle de acesso"
          icon={<UserPlus className="h-4 w-4" />}
          compact
        >
          <form
            className="grid gap-3"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutate({ ...values, role: "SUPERVISOR" })
            )}
          >
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Nome
              <span className="relative block">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 pl-9 text-sm font-normal normal-case tracking-normal text-foreground"
                  placeholder="Nome do supervisor"
                  autoComplete="name"
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
                  placeholder="supervisor@empresa.com"
                  autoComplete="email"
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
              Senha provisória
              <span className="relative block">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 pl-9 text-sm font-normal normal-case tracking-normal text-foreground"
                  type="password"
                  placeholder="SenhaForte@123"
                  autoComplete="new-password"
                  {...form.register("password")}
                />
              </span>
              {form.formState.errors.password ? (
                <span className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </span>
              ) : null}
            </label>

            <div className="flex items-center justify-between rounded-md border border-primary/15 bg-primary/8 px-3 py-2 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Perfil
              </div>
              <Badge variant="success">SUPERVISOR</Badge>
            </div>

            <Button type="submit" disabled={mutation.isPending} className="mt-1">
              {mutation.isPending ? (
                <UserPlus className="h-4 w-4 animate-pulse" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {mutation.isPending ? "Cadastrando..." : "Cadastrar supervisor"}
            </Button>
          </form>
        </DashboardPanel>

        <DashboardPanel
          title="Último cadastro"
          eyebrow="Confirmação"
          icon={<CheckCircle2 className="h-4 w-4" />}
          compact
        >
          {createdUser ? (
            <div className="grid gap-3">
              <div className="rounded-md border border-success/20 bg-success/10 p-3">
                <div className="text-sm font-bold">{createdUser.name}</div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {createdUser.email}
                </div>
              </div>
              <div className="text-xs leading-5 text-muted-foreground">
                O supervisor já pode acessar a Nexora Pulse com a senha provisória cadastrada.
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-background/60 p-3 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-white/5">
              Nenhum supervisor cadastrado nesta sessão.
            </div>
          )}
        </DashboardPanel>
      </section>
    </main>
  );
}
