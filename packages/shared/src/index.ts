import { z } from "zod";

export const TEAM_TYPES = ["CARDS", "LOANS", "OTHER"] as const;
export const ATTENDANCE_STATUSES = [
  "QUEUED",
  "IN_PROGRESS",
  "FINISHED",
  "CANCELLED"
] as const;

export const teamTypeSchema = z.enum(TEAM_TYPES);
export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUSES);

export type TeamType = z.infer<typeof teamTypeSchema>;
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const TEAM_LABELS: Record<TeamType, string> = {
  CARDS: "Time Cartoes",
  LOANS: "Time Emprestimos",
  OTHER: "Time Outros Assuntos"
};

export const SUBJECT_MATCHERS: Record<TeamType, string> = {
  CARDS: "Problemas com cartao",
  LOANS: "Contratacao de emprestimo",
  OTHER: "Outros assuntos"
};

export const REALTIME_EVENTS = [
  "attendance.created",
  "attendance.assigned",
  "attendance.queued",
  "attendance.finished",
  "attendance.cancelled",
  "queue.updated",
  "attendant.updated",
  "dashboard.updated"
] as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[number];

export function sanitizeText(value: string): string {
  return [...value]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeSubject(value: string): string {
  return sanitizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function resolveSubjectTeamType(subject: string): TeamType {
  const normalized = normalizeSubject(subject);

  if (normalized === "problemas com cartao") {
    return "CARDS";
  }

  if (normalized === "contratacao de emprestimo") {
    return "LOANS";
  }

  return "OTHER";
}

const sanitizedString = (field: string, min = 1, max = 160) =>
  z
    .string({ required_error: `${field} is required` })
    .transform(sanitizeText)
    .pipe(z.string().min(min).max(max));

export const createAttendanceSchema = z.object({
  customerName: sanitizedString("customerName", 2, 120),
  subject: sanitizedString("subject", 2, 140)
});

export const createAttendantSchema = z.object({
  name: sanitizedString("name", 2, 120),
  teamId: z.string().min(1),
  isOnline: z.boolean().default(true),
  maxConcurrentAttendances: z.coerce.number().int().min(1).max(10).default(3)
});

export const updateAttendantStatusSchema = z.object({
  isOnline: z.boolean()
});

export const attendanceQuerySchema = z.object({
  status: attendanceStatusSchema.optional(),
  teamId: z.string().min(1).optional(),
  attendantId: z.string().min(1).optional(),
  subject: z.string().transform(sanitizeText).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type CreateAttendantInput = z.infer<typeof createAttendantSchema>;
export type UpdateAttendantStatusInput = z.infer<
  typeof updateAttendantStatusSchema
>;
export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;

export interface TeamDto {
  id: string;
  name: string;
  type: TeamType;
  subjectMatcher: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendantDto {
  id: string;
  name: string;
  teamId: string;
  team: Pick<TeamDto, "id" | "name" | "type">;
  isOnline: boolean;
  maxConcurrentAttendances: number;
  currentLoad: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceDto {
  id: string;
  customerName: string;
  subject: string;
  status: AttendanceStatus;
  teamId: string;
  team: Pick<TeamDto, "id" | "name" | "type">;
  attendantId: string | null;
  attendant: Pick<AttendantDto, "id" | "name"> | null;
  queuedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface RouteAttendanceResult {
  attendance: AttendanceDto;
  assignedAttendance?: AttendanceDto | null;
  result: "ASSIGNED" | "QUEUED" | "FINISHED" | "CANCELLED" | "UNCHANGED";
  message: string;
}

export interface DashboardSummaryDto {
  totalAttendances: number;
  inProgress: number;
  queued: number;
  finished: number;
  cancelled: number;
  onlineAttendants: number;
  totalCapacity: number;
  usedCapacity: number;
  capacityUtilization: number;
  averageWaitSeconds: number;
}

export interface QueueMetricDto {
  teamId: string;
  teamName: string;
  teamType: TeamType;
  queued: number;
  oldestQueuedAt: string | null;
}

export interface AttendantLoadDto {
  attendantId: string;
  name: string;
  teamId: string;
  teamName: string;
  teamType: TeamType;
  isOnline: boolean;
  currentLoad: number;
  maxConcurrentAttendances: number;
  utilization: number;
}

export interface RecentActivityDto {
  id: string;
  customerName: string;
  subject: string;
  status: AttendanceStatus;
  teamName: string;
  attendantName: string | null;
  createdAt: string;
  updatedAt: string;
}
