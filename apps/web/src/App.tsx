import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { DashboardShell } from "./components/dashboard-shell";
import { queryClient } from "./lib/query-client";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return true;
  }

  const stored =
    window.localStorage.getItem("nexora-pulse-theme") ??
    window.localStorage.getItem("flowpay-theme");

  if (stored === "dark") return true;
  if (stored === "light") return false;

  return true;
}

export default function App() {
  const [dark, setDark] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("nexora-pulse-theme", dark ? "dark" : "light");
    document.title = "Nexora Pulse | AI Operations Command Center";
  }, [dark]);

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardShell dark={dark} onToggleTheme={() => setDark((v) => !v)} />
      <Toaster
        richColors
        closeButton
        position="top-right"
        theme={dark ? "dark" : "light"}
      />
    </QueryClientProvider>
  );
}
