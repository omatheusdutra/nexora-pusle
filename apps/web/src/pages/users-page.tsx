import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  KeyRound,
  Mail,
  Save,
  ShieldCheck,
  UserPlus,
  UserRound,
  UsersRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import {
  createUserSchema,
  updateUserSchema,
  type AuthUserDto,
  type CreateUserInput,
  type UpdateUserInput,
  type UserDto
} from "@flowpay/shared";
import { useAuth } from "../auth/auth-context";
import { DashboardPanel } from "../components/dashboard-panel";
import { PageHeader } from "../components/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";
import { api } from "../lib/api";

const roleLabels = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor"
} as const;

const statusLabels = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo"
} as const;

function formatDate(value: string | null) {
  if (!value) return "Nunca";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function toEditDefaults(user: UserDto | null): UpdateUserInput {
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "SUPERVISOR",
    status: user?.status ?? "ACTIVE"
  };
}

export function UsersPage() {
  const { user, updateSessionUser } = useAuth();
  const queryClient = useQueryClient();
  const [createdUser, setCreatedUser] = useState<AuthUserDto | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: api.getUsers,
    enabled: user?.role === "ADMIN"
  });
  const users = usersQuery.data?.users ?? [];
  const selectedUser = useMemo(
    () =>
      users.find((item) => item.id === selectedUserId) ?? users[0] ?? null,
    [selectedUserId, users]
  );
  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "SUPERVISOR"
    }
  });
  const editForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: toEditDefaults(selectedUser)
  });

  useEffect(() => {
    if (!selectedUserId && users[0]) {
      setSelectedUserId(users[0].id);
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    editForm.reset(toEditDefaults(selectedUser));
  }, [editForm, selectedUser]);

  const createMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: ({ user: created }) => {
      setCreatedUser(created);
      setSelectedUserId(created.id);
      toast.success("Supervisor cadastrado");
      createForm.reset({
        name: "",
        email: "",
        password: "",
        role: "SUPERVISOR"
      });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Falha ao cadastrar supervisor"
      );
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      api.updateUser(id, input),
    onSuccess: ({ user: updatedUser }) => {
      toast.success("Perfil atualizado");
      if (updatedUser.id === user?.id) {
        updateSessionUser(updatedUser);
      }
      editForm.reset(toEditDefaults(updatedUser));
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Falha ao atualizar perfil"
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
        description="Cadastre supervisores e gerencie perfis operacionais com sessão segura."
        action={<Badge variant="primary">ADMIN</Badge>}
      />

      <section className="grid gap-3 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
        <DashboardPanel
          title="Novo supervisor"
          eyebrow="Controle de acesso"
          icon={<UserPlus className="h-4 w-4" />}
          compact
        >
          <form
            className="grid gap-3"
            onSubmit={createForm.handleSubmit((values) =>
              createMutation.mutate({ ...values, role: "SUPERVISOR" })
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
                  {...createForm.register("name")}
                />
              </span>
              {createForm.formState.errors.name ? (
                <span className="text-xs text-destructive">
                  {createForm.formState.errors.name.message}
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
                  {...createForm.register("email")}
                />
              </span>
              {createForm.formState.errors.email ? (
                <span className="text-xs text-destructive">
                  {createForm.formState.errors.email.message}
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
                  {...createForm.register("password")}
                />
              </span>
              {createForm.formState.errors.password ? (
                <span className="text-xs text-destructive">
                  {createForm.formState.errors.password.message}
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

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="mt-1"
            >
              {createMutation.isPending ? (
                <UserPlus className="h-4 w-4 animate-pulse" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {createMutation.isPending
                ? "Cadastrando..."
                : "Cadastrar supervisor"}
            </Button>
          </form>
        </DashboardPanel>

        <div className="grid gap-3 xl:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
          <DashboardPanel
            title="Perfis cadastrados"
            eyebrow="Usuários"
            icon={<UsersRound className="h-4 w-4" />}
            compact
          >
            <div className="grid gap-2">
              {usersQuery.isLoading ? (
                <div className="rounded-md border border-border bg-background/60 p-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5">
                  Carregando usuários...
                </div>
              ) : null}
              {users.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedUserId(item.id)}
                  className={cn(
                    "rounded-md border p-3 text-left transition",
                    selectedUser?.id === item.id
                      ? "border-primary/35 bg-primary/10"
                      : "border-border bg-background/60 hover:border-primary/25 hover:bg-primary/6 dark:border-white/10 dark:bg-white/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">
                        {item.name}
                      </div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {item.email}
                      </div>
                    </div>
                    <Badge
                      variant={item.status === "ACTIVE" ? "success" : "neutral"}
                    >
                      {statusLabels[item.status]}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {roleLabels[item.role]} · Último login:{" "}
                    {formatDate(item.lastLoginAt)}
                  </div>
                </button>
              ))}
              {!usersQuery.isLoading && users.length === 0 ? (
                <div className="rounded-md border border-border bg-background/60 p-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5">
                  Nenhum usuário encontrado.
                </div>
              ) : null}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Editar perfil"
            eyebrow="Administração"
            icon={<Save className="h-4 w-4" />}
            compact
          >
            {selectedUser ? (
              <form
                className="grid gap-3"
                onSubmit={editForm.handleSubmit((values) =>
                  updateMutation.mutate({
                    id: selectedUser.id,
                    input: values
                  })
                )}
              >
                <div className="rounded-md border border-success/20 bg-success/10 p-3">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {createdUser?.id === selectedUser.id
                      ? "Supervisor cadastrado nesta sessão"
                      : "Perfil selecionado"}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {selectedUser.email}
                  </div>
                </div>

                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Nome
                  <Input
                    className="h-10 text-sm font-normal normal-case tracking-normal text-foreground"
                    autoComplete="name"
                    {...editForm.register("name")}
                  />
                  {editForm.formState.errors.name ? (
                    <span className="text-xs text-destructive">
                      {editForm.formState.errors.name.message}
                    </span>
                  ) : null}
                </label>

                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  E-mail
                  <Input
                    className="h-10 text-sm font-normal normal-case tracking-normal text-foreground"
                    autoComplete="email"
                    {...editForm.register("email")}
                  />
                  {editForm.formState.errors.email ? (
                    <span className="text-xs text-destructive">
                      {editForm.formState.errors.email.message}
                    </span>
                  ) : null}
                </label>

                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Nova senha
                  <Input
                    className="h-10 text-sm font-normal normal-case tracking-normal text-foreground"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Deixe em branco para manter a atual"
                    {...editForm.register("password")}
                  />
                  {editForm.formState.errors.password ? (
                    <span className="text-xs text-destructive">
                      {editForm.formState.errors.password.message}
                    </span>
                  ) : null}
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Papel
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35 dark:bg-white/5"
                      {...editForm.register("role")}
                    >
                      <option value="ADMIN">Administrador</option>
                      <option value="SUPERVISOR">Supervisor</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Status
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35 dark:bg-white/5"
                      {...editForm.register("status")}
                    >
                      <option value="ACTIVE">Ativo</option>
                      <option value="INACTIVE">Inativo</option>
                    </select>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="mt-1"
                >
                  {updateMutation.isPending ? (
                    <Save className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {updateMutation.isPending
                    ? "Salvando..."
                    : "Salvar alterações"}
                </Button>
              </form>
            ) : (
              <div className="rounded-md border border-border bg-background/60 p-3 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-white/5">
                Selecione um perfil para editar.
              </div>
            )}
          </DashboardPanel>
        </div>
      </section>
    </main>
  );
}
