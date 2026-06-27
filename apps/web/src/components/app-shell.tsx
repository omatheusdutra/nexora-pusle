import { Outlet, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { useRealtimeInvalidation } from "../hooks/use-realtime";
import { cn } from "../lib/utils";

export interface AppShellContext {
  connected: boolean;
  dark: boolean;
  onToggleTheme: () => void;
}

function getInitialSidebarState() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem("nexora-sidebar-collapsed") === "true";
}

export function AppShell({
  dark,
  onToggleTheme
}: {
  dark: boolean;
  onToggleTheme: () => void;
}) {
  const connected = useRealtimeInvalidation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(getInitialSidebarState);

  useEffect(() => {
    window.localStorage.setItem(
      "nexora-sidebar-collapsed",
      collapsed ? "true" : "false"
    );
  }, [collapsed]);

  const refreshAll = () => {
    void queryClient.invalidateQueries();
  };

  return (
    <div className="min-h-screen">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />
      <div
        className={cn(
          "min-w-0 transition-all duration-300",
          collapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <AppHeader
          connected={connected}
          dark={dark}
          onToggleTheme={onToggleTheme}
          onRefresh={refreshAll}
          onSearchFocus={() => navigate("/attendances")}
        />
        <Outlet
          context={{ connected, dark, onToggleTheme } satisfies AppShellContext}
        />
      </div>
    </div>
  );
}
