import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { CreateAttendanceForm } from "./create-attendance-form";
import { MetricsGrid } from "./metrics-grid";
import { RecentActivityTable } from "./recent-activity-table";
import { Skeleton } from "./ui/skeleton";

const DashboardCharts = lazy(() => import("./dashboard-charts"));
const DashboardOperationsColumn = lazy(
  () => import("./dashboard-operations-column")
);

export function DashboardShell() {
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

  return (
    <main className="grid gap-3 px-4 py-3 sm:px-5 xl:px-6">
      <MetricsGrid summary={summary.data} loading={summary.isLoading} />

      <section className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <CreateAttendanceForm />
        <Suspense fallback={<ChartsFallback />}>
          <DashboardCharts
            queues={queues.data}
            queuesLoading={queues.isLoading}
            attendantsLoad={attendantsLoad.data}
            attendantsLoading={attendantsLoad.isLoading}
          />
        </Suspense>
      </section>

      <section className="grid gap-3 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
        <Suspense fallback={<OperationsFallback />}>
          <DashboardOperationsColumn
            attendants={attendantsLoad.data}
            loading={attendantsLoad.isLoading}
          />
        </Suspense>
        <RecentActivityTable
          rows={recentActivity.data}
          loading={recentActivity.isLoading}
        />
      </section>
    </main>
  );
}

function ChartsFallback() {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Skeleton className="h-[266px]" />
      <Skeleton className="h-[266px]" />
    </div>
  );
}

function OperationsFallback() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-[228px]" />
      <Skeleton className="h-[228px]" />
      <Skeleton className="h-[360px]" />
    </div>
  );
}
