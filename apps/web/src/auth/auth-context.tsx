import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUserDto, LoginInput } from "@flowpay/shared";
import {
  createContext,
  useContext,
  type PropsWithChildren
} from "react";
import { api } from "../lib/api";

interface AuthContextValue {
  user: AuthUserDto | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  login: (input: LoginInput) => Promise<AuthUserDto>;
  logout: () => Promise<void>;
  updateSessionUser: (user: AuthUserDto) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.getCurrentUser,
    retry: false,
    staleTime: 60_000
  });
  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
    }
  });
  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth"
      });
      queryClient.setQueryData(["auth", "me"], null);
    }
  });

  const value: AuthContextValue = {
    user: session.data?.user ?? null,
    isLoading: session.isLoading,
    isLoggingIn: loginMutation.isPending,
    login: async (input) => {
      const response = await loginMutation.mutateAsync(input);
      return response.user;
    },
    logout: async () => {
      await logoutMutation.mutateAsync().catch(() => undefined);
    },
    updateSessionUser: (user) => {
      queryClient.setQueryData(["auth", "me"], { user });
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
