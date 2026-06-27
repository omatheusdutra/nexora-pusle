import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useRealtimeInvalidation } from "../hooks/use-realtime";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { AttendantsPanel } from "./attendants-panel";
import { CreateAttendanceForm } from "./create-attendance-form";
import { LoadChart } from "./load-chart";
import { MetricsGrid } from "./metrics-grid";
import { QueuesChart } from "./queues-chart";
import { RecentActivityTable } from "./recent-activity-table";

export function DashboardShell({
  dark,
  onToggleTheme
}: {
  dark: boolean;
  onToggleTheme: () => void;
}) {
  const connected = useRealtimeInvalidation();
  const summary = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: api.getSummary
  });
  const queues = useQuery({
    queryKey: ["dashboard", "queues"],
    queryFn: api.getQueues
  });
  const attendantsLoad = useQuery({
    queryKey: ["dashboard", "attendants-load"],
    queryFn: api.getAttendantsLoad
  });
  const recentActivity = useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: () => api.getRecentActivity(15)
  });

  const refreshAll = () => {
    void summary.refetch();
    void queues.refetch();
    void attendantsLoad.refetch();
    void recentActivity.refetch();
  };

  return (
    <div className="min-h-screen">
      <AppSidebar />
      <div className="min-w-0 lg:pl-72">
        <AppHeader
          connected={connected}
          dark={dark}
          onToggleTheme={onToggleTheme}
          onRefresh={refreshAll}
        />

        <main className="grid gap-5 px-4 py-5 sm:px-6 xl:px-8">
          <MetricsGrid summary={summary.data} loading={summary.isLoading} />

          <section className="grid gap-5 2xl:grid-cols-[380px_1fr]">
            <CreateAttendanceForm />
            <div className="grid gap-5 xl:grid-cols-2">
              <QueuesChart data={queues.data} loading={queues.isLoading} />
              <LoadChart
                data={attendantsLoad.data}
                loading={attendantsLoad.isLoading}
              />
            </div>
          </section>

          <section className="grid gap-5 2xl:grid-cols-[430px_1fr]">
            <AttendantsPanel
              attendants={attendantsLoad.data}
              loading={attendantsLoad.isLoading}
            />
            <RecentActivityTable
              rows={recentActivity.data}
              loading={recentActivity.isLoading}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
