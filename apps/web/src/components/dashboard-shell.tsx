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
import { TeamDistributionChart } from "./team-distribution-chart";

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
      <div className="min-w-0 lg:pl-64">
        <AppHeader
          connected={connected}
          dark={dark}
          onToggleTheme={onToggleTheme}
          onRefresh={refreshAll}
        />

        <main className="grid gap-4 px-4 py-4 sm:px-5 xl:px-6">
          <MetricsGrid summary={summary.data} loading={summary.isLoading} />

          <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
            <CreateAttendanceForm />
            <div className="grid gap-4 xl:grid-cols-2">
              <QueuesChart data={queues.data} loading={queues.isLoading} />
              <LoadChart
                data={attendantsLoad.data}
                loading={attendantsLoad.isLoading}
              />
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]">
            <div className="grid gap-4">
              <TeamDistributionChart />
              <AttendantsPanel
                attendants={attendantsLoad.data}
                loading={attendantsLoad.isLoading}
              />
            </div>
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
