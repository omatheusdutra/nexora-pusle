import type {
  AuditEventDto,
  AuditEventQuery,
  AttendantDto,
  AttendanceDto,
  AttendanceQuery,
  CreateAttendanceInput,
  CreateAttendantInput,
  DashboardSummaryDto,
  PaginatedResponse,
  QueueMetricDto,
  RecentActivityDto,
  OperationalMetricsDto,
  RouteAttendanceResult,
  AttendantLoadDto,
  TeamDto,
  RealtimeEventName,
  UpdateAttendantStatusInput
} from "@flowpay/shared";

export interface WorkflowEvent {
  name: RealtimeEventName;
  payload: unknown;
}

export interface WorkflowResult<T> {
  data: T;
  events: WorkflowEvent[];
}

export interface AttendanceWorkflow {
  createAttendance(
    input: CreateAttendanceInput
  ): Promise<WorkflowResult<RouteAttendanceResult>>;
  finishAttendance(id: string): Promise<WorkflowResult<RouteAttendanceResult>>;
  cancelAttendance(id: string): Promise<WorkflowResult<RouteAttendanceResult>>;
  listAttendances(
    query: AttendanceQuery
  ): Promise<PaginatedResponse<AttendanceDto>>;
  getAttendance(id: string): Promise<AttendanceDto | null>;
}

export interface AttendantWorkflow {
  listAttendants(): Promise<AttendantDto[]>;
  createAttendant(
    input: CreateAttendantInput
  ): Promise<WorkflowResult<AttendantDto>>;
  updateAttendantStatus(
    id: string,
    input: UpdateAttendantStatusInput
  ): Promise<WorkflowResult<AttendantDto>>;
}

export interface TeamQueries {
  listTeams(): Promise<TeamDto[]>;
}

export interface DashboardQueries {
  getSummary(): Promise<DashboardSummaryDto>;
  getQueues(): Promise<QueueMetricDto[]>;
  getAttendantsLoad(): Promise<AttendantLoadDto[]>;
  getRecentActivity(limit?: number): Promise<RecentActivityDto[]>;
}

export interface AuditQueries {
  listAuditEvents(
    query: AuditEventQuery
  ): Promise<PaginatedResponse<AuditEventDto>>;
}

export interface MetricsQueries {
  getOperationalMetrics(): Promise<OperationalMetricsDto>;
}

export interface RealtimePublisher {
  publish(event: WorkflowEvent): void | Promise<void>;
}

export interface AppContainer {
  attendanceWorkflow: AttendanceWorkflow;
  attendantWorkflow: AttendantWorkflow;
  teamQueries: TeamQueries;
  dashboardQueries: DashboardQueries;
  auditQueries: AuditQueries;
  metricsQueries: MetricsQueries;
  realtime: RealtimePublisher;
}
