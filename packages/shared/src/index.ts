import { z } from "zod";

export const TEAM_TYPES = ["CARDS", "LOANS", "OTHER"] as const;
export const ATTENDANCE_STATUSES = [
  "QUEUED",
  "IN_PROGRESS",
  "FINISHED",
  "CANCELLED"
] as const;
export const USER_ROLES = ["ADMIN", "SUPERVISOR"] as const;
export const USER_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const teamTypeSchema = z.enum(TEAM_TYPES);
export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUSES);
export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);

export type TeamType = z.infer<typeof teamTypeSchema>;
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;

export const TEAM_LABELS: Record<TeamType, string> = {
  CARDS: "Time Cartões",
  LOANS: "Time Empréstimos",
  OTHER: "Time Outros Assuntos"
};

export const SUBJECT_MATCHERS: Record<TeamType, string> = {
  CARDS: "Problemas com cartão",
  LOANS: "Contratação de empréstimo",
  OTHER: "Outros assuntos"
};

export const REALTIME_EVENTS = [
  "attendance.created",
  "attendance.assigned",
  "attendance.queued",
  "attendance.finished",
  "attendance.cancelled",
  "attendance.reassigned",
  "queue.updated",
  "attendant.updated",
  "dashboard.updated"
] as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[number];

export const AUDIT_EVENT_TYPES = [
  "ATTENDANCE_CREATED",
  "ATTENDANCE_ASSIGNED",
  "ATTENDANCE_QUEUED",
  "ATTENDANCE_FINISHED",
  "ATTENDANCE_CANCELLED",
  "ATTENDANCE_REASSIGNED",
  "ATTENDANT_ONLINE",
  "ATTENDANT_OFFLINE"
] as const;

export const AUDIT_ENTITY_TYPES = ["ATTENDANCE", "ATTENDANT"] as const;

export const auditEventTypeSchema = z.enum(AUDIT_EVENT_TYPES);
export const auditEntityTypeSchema = z.enum(AUDIT_ENTITY_TYPES);

export type AuditEventType = z.infer<typeof auditEventTypeSchema>;
export type AuditEntityType = z.infer<typeof auditEntityTypeSchema>;

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
    .string({ required_error: `${field} é obrigatório` })
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(min, `${field} deve conter pelo menos ${min} caracteres`)
        .max(max, `${field} deve conter no máximo ${max} caracteres`)
    );

const emailSchema = z
  .string({ required_error: "E-mail é obrigatório" })
  .email("Informe um e-mail válido")
  .trim()
  .toLowerCase();

const passwordSchema = z
  .string({ required_error: "Senha é obrigatória" })
  .min(10, "A senha deve conter pelo menos 10 caracteres")
  .max(160, "A senha deve conter no máximo 160 caracteres");

const optionalPasswordSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  passwordSchema.optional()
);

export const createAttendanceSchema = z.object({
  customerName: sanitizedString("Cliente", 2, 120),
  subject: sanitizedString("Assunto", 2, 140)
});

export const createAttendantSchema = z.object({
  name: sanitizedString("Nome", 2, 120),
  teamId: z.string().min(1, "Time é obrigatório"),
  isOnline: z.boolean().default(true),
  maxConcurrentAttendances: z.coerce.number().int().min(1).max(10).default(3)
});

export const updateAttendantStatusSchema = z.object({
  isOnline: z.boolean()
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória").max(160)
});

export const createUserSchema = z.object({
  name: sanitizedString("Nome", 2, 120),
  email: emailSchema,
  password: passwordSchema,
  role: userRoleSchema.default("SUPERVISOR")
});

export const updateOwnProfileSchema = z.object({
  name: sanitizedString("Nome", 2, 120),
  email: emailSchema,
  password: optionalPasswordSchema
});

export const updateUserSchema = z
  .object({
    name: sanitizedString("Nome", 2, 120).optional(),
    email: emailSchema.optional(),
    password: optionalPasswordSchema,
    role: userRoleSchema.optional(),
    status: userStatusSchema.optional()
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    "Informe ao menos um campo para atualizar"
  );

export const attendanceQuerySchema = z.object({
  status: attendanceStatusSchema.optional(),
  teamId: z.string().min(1).optional(),
  attendantId: z.string().min(1).optional(),
  subject: z.string().transform(sanitizeText).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export const auditEventQuerySchema = z.object({
  type: auditEventTypeSchema.optional(),
  entityType: auditEntityTypeSchema.optional(),
  entityId: z.string().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type CreateAttendantInput = z.infer<typeof createAttendantSchema>;
export type UpdateAttendantStatusInput = z.infer<
  typeof updateAttendantStatusSchema
>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;
export type AuditEventQuery = z.infer<typeof auditEventQuerySchema>;

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponseDto {
  user: AuthUserDto;
}

export interface UserDto extends AuthUserDto {
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

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

export interface AuditEventDto {
  id: string;
  type: AuditEventType;
  entityType: AuditEntityType;
  entityId: string;
  payload: unknown;
  createdAt: string;
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

export interface OperationalMetricsDto extends DashboardSummaryDto {
  generatedAt: string;
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
