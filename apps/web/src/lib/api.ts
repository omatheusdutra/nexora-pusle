import type {
  AuditEventDto,
  AuditEventQuery,
  AttendantDto,
  AttendantLoadDto,
  AttendanceDto,
  AttendanceQuery,
  CreateAttendanceInput,
  DashboardSummaryDto,
  PaginatedResponse,
  QueueMetricDto,
  RecentActivityDto,
  RouteAttendanceResult,
  TeamDto
} from "@flowpay/shared";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3333/api/v1";

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.error ?? "API request failed", response.status);
  }

  return response.json() as Promise<T>;
}

function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  const value = search.toString();
  return value ? `?${value}` : "";
}

export const api = {
  getTeams: () => requestJson<TeamDto[]>("/teams"),
  getSummary: () => requestJson<DashboardSummaryDto>("/dashboard/summary"),
  getQueues: () => requestJson<QueueMetricDto[]>("/dashboard/queues"),
  getAttendantsLoad: () =>
    requestJson<AttendantLoadDto[]>("/dashboard/attendants-load"),
  getRecentActivity: (limit = 15) =>
    requestJson<RecentActivityDto[]>(
      `/dashboard/recent-activity${queryString({ limit })}`
    ),
  getAttendants: () => requestJson<AttendantDto[]>("/attendants"),
  listAttendances: (query: Partial<AttendanceQuery> = {}) =>
    requestJson<PaginatedResponse<AttendanceDto>>(
      `/attendances${queryString(query)}`
    ),
  listAuditEvents: (query: Partial<AuditEventQuery> = {}) =>
    requestJson<PaginatedResponse<AuditEventDto>>(
      `/audit-events${queryString(query)}`
    ),
  createAttendance: (input: CreateAttendanceInput) =>
    requestJson<RouteAttendanceResult>("/attendances", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  finishAttendance: (id: string) =>
    requestJson<RouteAttendanceResult>(`/attendances/${id}/finish`, {
      method: "PATCH"
    }),
  cancelAttendance: (id: string) =>
    requestJson<RouteAttendanceResult>(`/attendances/${id}/cancel`, {
      method: "PATCH"
    }),
  updateAttendantStatus: (id: string, isOnline: boolean) =>
    requestJson<AttendantDto>(`/attendants/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isOnline })
    })
};
