import type { AttendantLoadDto } from "@flowpay/shared";
import { AuditActivityPanel } from "./audit-activity-panel";
import { AttendantsPanel } from "./attendants-panel";
import { TeamDistributionChart } from "./team-distribution-chart";

export default function DashboardOperationsColumn({
  attendants,
  loading
}: {
  attendants?: AttendantLoadDto[];
  loading: boolean;
}) {
  return (
    <div className="grid gap-3">
      <TeamDistributionChart />
      <AuditActivityPanel />
      <AttendantsPanel attendants={attendants} loading={loading} />
    </div>
  );
}
