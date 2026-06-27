import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "./components/app-shell";
import { queryClient } from "./lib/query-client";
import { AttendancesPage } from "./pages/attendances-page";
import { AttendantsPage } from "./pages/attendants-page";
import { ClientsPage } from "./pages/clients-page";
import { DashboardPage } from "./pages/dashboard-page";
import { QualityPage } from "./pages/quality-page";
import { QueuesPage } from "./pages/queues-page";
import { ReportsPage } from "./pages/reports-page";
import { SettingsPage } from "./pages/settings-page";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return true;
  }

  const stored = window.localStorage.getItem("nexora-pulse-theme");

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
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <AppShell dark={dark} onToggleTheme={() => setDark((v) => !v)} />
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="attendances" element={<AttendancesPage />} />
            <Route path="queues" element={<QueuesPage />} />
            <Route path="attendants" element={<AttendantsPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="quality" element={<QualityPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        richColors
        closeButton
        position="top-right"
        theme={dark ? "dark" : "light"}
      />
    </QueryClientProvider>
  );
}
