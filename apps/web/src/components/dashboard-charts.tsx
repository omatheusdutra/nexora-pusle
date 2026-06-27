import type { AttendantLoadDto, QueueMetricDto } from "@flowpay/shared";
import { LoadChart } from "./load-chart";
import { QueuesChart } from "./queues-chart";

export default function DashboardCharts({
  attendantsLoad,
  attendantsLoading,
  queues,
  queuesLoading
}: {
  attendantsLoad?: AttendantLoadDto[];
  attendantsLoading: boolean;
  queues?: QueueMetricDto[];
  queuesLoading: boolean;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <QueuesChart data={queues} loading={queuesLoading} />
      <LoadChart data={attendantsLoad} loading={attendantsLoading} />
    </div>
  );
}
