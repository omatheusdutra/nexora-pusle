import {
  SUBJECT_MATCHERS,
  TEAM_LABELS,
  type AuditEntityType,
  type AuditEventDto,
  type AuditEventQuery,
  type AuditEventType,
  type AttendantDto,
  type AttendantLoadDto,
  type AttendanceDto,
  type AttendanceQuery,
  type AttendanceStatus,
  type AuthUserDto,
  type CreateAttendanceInput,
  type CreateAttendantInput,
  type DashboardSummaryDto,
  type PaginatedResponse,
  type QueueMetricDto,
  type RecentActivityDto,
  type OperationalMetricsDto,
  type RouteAttendanceResult,
  type TeamDto,
  type TeamType,
  type UserStatus,
  type UpdateAttendantStatusInput
} from "@flowpay/shared";
import type {
  AppContainer,
  AuditQueries,
  AttendantWorkflow,
  AttendanceWorkflow,
  DashboardQueries,
  MetricsQueries,
  RealtimePublisher,
  CreateUserRecordInput,
  TeamQueries,
  UserRecord,
  UserRepository,
  WorkflowEvent,
  WorkflowResult
} from "../../application/contracts";
import {
  DistributionPolicy,
  type AssignableAttendant
} from "../../domain/distribution-policy";
import { ConflictError, NotFoundError } from "../../domain/errors";
import { SubjectRouter } from "../../domain/subject-router";
import { hashPasswordSync } from "../../auth/password";
import { NoopRealtimePublisher } from "../realtime/noop-realtime-publisher";

interface MemoryTeam {
  id: string;
  name: string;
  type: TeamType;
  subjectMatcher: string;
  roundRobinCursor: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryAttendant {
  id: string;
  name: string;
  teamId: string;
  isOnline: boolean;
  maxConcurrentAttendances: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryAttendance {
  id: string;
  customerName: string;
  subject: string;
  status: AttendanceStatus;
  teamId: string;
  attendantId: string | null;
  queuedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryAuditEvent {
  id: string;
  type: AuditEventType;
  entityType: AuditEntityType;
  entityId: string;
  payload: unknown;
  createdAt: Date;
}

interface MemoryUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AuthUserDto["role"];
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemoryWorkflow
  implements
    AttendanceWorkflow,
    AttendantWorkflow,
    TeamQueries,
    DashboardQueries,
    AuditQueries,
    MetricsQueries,
    UserRepository
{
  private readonly subjectRouter = new SubjectRouter();
  private readonly distributionPolicy = new DistributionPolicy();
  private readonly teams = new Map<string, MemoryTeam>();
  private readonly attendants = new Map<string, MemoryAttendant>();
  private readonly attendances = new Map<string, MemoryAttendance>();
  private readonly auditEvents = new Map<string, MemoryAuditEvent>();
  private readonly users = new Map<string, MemoryUser>();
  private sequence = 0;

  constructor() {
    this.seed();
  }

  async createAttendance(
    input: CreateAttendanceInput
  ): Promise<WorkflowResult<RouteAttendanceResult>> {
    const teamType = this.subjectRouter.resolve(input.subject);
    const team = this.findTeamByType(teamType);
    const now = new Date();
    const assignment = this.pickAvailableAttendant(team.id);
    const attendance: MemoryAttendance = {
      id: this.nextId("att"),
      customerName: input.customerName,
      subject: input.subject,
      status: assignment ? "IN_PROGRESS" : "QUEUED",
      teamId: team.id,
      attendantId: assignment?.attendantId ?? null,
      queuedAt: now,
      startedAt: assignment ? now : null,
      finishedAt: null,
      createdAt: now,
      updatedAt: now
    };

    if (assignment) {
      team.roundRobinCursor = assignment.nextCursor;
      team.updatedAt = now;
    }

    this.attendances.set(attendance.id, attendance);
    this.writeAuditEvent("ATTENDANCE_CREATED", "ATTENDANCE", attendance.id, {
      status: attendance.status,
      teamId: attendance.teamId,
      attendantId: attendance.attendantId
    });
    this.writeAuditEvent(
      assignment ? "ATTENDANCE_ASSIGNED" : "ATTENDANCE_QUEUED",
      "ATTENDANCE",
      attendance.id,
      {
        status: attendance.status,
        teamId: attendance.teamId,
        attendantId: attendance.attendantId
      }
    );
    const dto = this.toAttendanceDto(attendance);
    const events: WorkflowEvent[] = [
      { name: "attendance.created", payload: dto },
      {
        name: assignment ? "attendance.assigned" : "attendance.queued",
        payload: dto
      },
      { name: "queue.updated", payload: { teamId: team.id } },
      { name: "dashboard.updated", payload: {} }
    ];

    return {
      data: {
        attendance: dto,
        result: assignment ? "ASSIGNED" : "QUEUED",
        message: assignment
          ? "Attendance assigned automatically"
          : "Attendance queued because team capacity is full"
      },
      events
    };
  }

  async finishAttendance(
    id: string
  ): Promise<WorkflowResult<RouteAttendanceResult>> {
    const attendance = this.getMutableAttendance(id);

    if (attendance.status === "FINISHED") {
      return this.unchanged(attendance, "Attendance already finished");
    }

    if (attendance.status !== "IN_PROGRESS") {
      throw new ConflictError("Only in-progress attendances can be finished");
    }

    const now = new Date();
    attendance.status = "FINISHED";
    attendance.finishedAt = now;
    attendance.updatedAt = now;

    const next = this.assignNextQueued(attendance.teamId);
    this.writeAuditEvent("ATTENDANCE_FINISHED", "ATTENDANCE", attendance.id, {
      teamId: attendance.teamId,
      attendantId: attendance.attendantId
    });

    if (next) {
      this.writeAuditEvent("ATTENDANCE_ASSIGNED", "ATTENDANCE", next.id, {
        teamId: next.teamId,
        attendantId: next.attendantId,
        source: "QUEUE_PULL"
      });
    }
    const dto = this.toAttendanceDto(attendance);
    const events: WorkflowEvent[] = [
      { name: "attendance.finished", payload: dto },
      { name: "queue.updated", payload: { teamId: attendance.teamId } },
      { name: "dashboard.updated", payload: {} }
    ];

    if (next) {
      events.splice(1, 0, {
        name: "attendance.assigned",
        payload: this.toAttendanceDto(next)
      });
    }

    return {
      data: {
        attendance: dto,
        assignedAttendance: next ? this.toAttendanceDto(next) : null,
        result: "FINISHED",
        message: next
          ? "Attendance finished and next queued attendance assigned"
          : "Attendance finished"
      },
      events
    };
  }

  async cancelAttendance(
    id: string
  ): Promise<WorkflowResult<RouteAttendanceResult>> {
    const attendance = this.getMutableAttendance(id);

    if (attendance.status === "CANCELLED") {
      return this.unchanged(attendance, "Attendance already cancelled");
    }

    if (attendance.status === "FINISHED") {
      throw new ConflictError("Finished attendances cannot be cancelled");
    }

    const shouldPullNext = attendance.status === "IN_PROGRESS";
    const now = new Date();
    attendance.status = "CANCELLED";
    attendance.finishedAt = now;
    attendance.updatedAt = now;
    const next = shouldPullNext ? this.assignNextQueued(attendance.teamId) : null;
    this.writeAuditEvent("ATTENDANCE_CANCELLED", "ATTENDANCE", attendance.id, {
      teamId: attendance.teamId,
      attendantId: attendance.attendantId
    });

    if (next) {
      this.writeAuditEvent("ATTENDANCE_ASSIGNED", "ATTENDANCE", next.id, {
        teamId: next.teamId,
        attendantId: next.attendantId,
        source: "QUEUE_PULL"
      });
    }
    const dto = this.toAttendanceDto(attendance);
    const events: WorkflowEvent[] = [
      { name: "attendance.cancelled", payload: dto },
      { name: "queue.updated", payload: { teamId: attendance.teamId } },
      { name: "dashboard.updated", payload: {} }
    ];

    if (next) {
      events.splice(1, 0, {
        name: "attendance.assigned",
        payload: this.toAttendanceDto(next)
      });
    }

    return {
      data: {
        attendance: dto,
        assignedAttendance: next ? this.toAttendanceDto(next) : null,
        result: "CANCELLED",
        message: next
          ? "Attendance cancelled and next queued attendance assigned"
          : "Attendance cancelled"
      },
      events
    };
  }

  async listAttendances(
    query: AttendanceQuery
  ): Promise<PaginatedResponse<AttendanceDto>> {
    const filtered = [...this.attendances.values()]
      .filter((attendance) => {
        if (query.status && attendance.status !== query.status) return false;
        if (query.teamId && attendance.teamId !== query.teamId) return false;
        if (query.attendantId && attendance.attendantId !== query.attendantId) {
          return false;
        }
        if (
          query.subject &&
          !attendance.subject
            .toLowerCase()
            .includes(query.subject.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const start = (query.page - 1) * query.pageSize;
    const data = filtered
      .slice(start, start + query.pageSize)
      .map((attendance) => this.toAttendanceDto(attendance));

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / query.pageSize)
    };
  }

  async getAttendance(id: string): Promise<AttendanceDto | null> {
    const attendance = this.attendances.get(id);
    return attendance ? this.toAttendanceDto(attendance) : null;
  }

  async listAttendants(): Promise<AttendantDto[]> {
    return [...this.attendants.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((attendant) => this.toAttendantDto(attendant));
  }

  async createAttendant(
    input: CreateAttendantInput
  ): Promise<WorkflowResult<AttendantDto>> {
    const team = this.teams.get(input.teamId);

    if (!team) {
      throw new NotFoundError("Team");
    }

    const now = new Date();
    const attendant: MemoryAttendant = {
      id: this.nextId("agent"),
      name: input.name,
      teamId: input.teamId,
      isOnline: input.isOnline,
      maxConcurrentAttendances: input.maxConcurrentAttendances,
      createdAt: now,
      updatedAt: now
    };

    this.attendants.set(attendant.id, attendant);
    const next = input.isOnline ? this.assignNextQueued(attendant.teamId) : null;
    this.writeAuditEvent(
      input.isOnline ? "ATTENDANT_ONLINE" : "ATTENDANT_OFFLINE",
      "ATTENDANT",
      attendant.id,
      {
        teamId: attendant.teamId,
        source: "ATTENDANT_CREATED"
      }
    );

    if (next) {
      this.writeAuditEvent("ATTENDANCE_ASSIGNED", "ATTENDANCE", next.id, {
        teamId: next.teamId,
        attendantId: next.attendantId,
        source: "ATTENDANT_ONLINE"
      });
    }
    const dto = this.toAttendantDto(attendant);
    const events: WorkflowEvent[] = [
      { name: "attendant.updated", payload: dto },
      { name: "queue.updated", payload: { teamId: attendant.teamId } },
      { name: "dashboard.updated", payload: {} }
    ];

    if (next) {
      events.splice(1, 0, {
        name: "attendance.assigned",
        payload: this.toAttendanceDto(next)
      });
    }

    return {
      data: dto,
      events
    };
  }

  async updateAttendantStatus(
    id: string,
    input: UpdateAttendantStatusInput
  ): Promise<WorkflowResult<AttendantDto>> {
    const attendant = this.attendants.get(id);

    if (!attendant) {
      throw new NotFoundError("Attendant");
    }

    attendant.isOnline = input.isOnline;
    attendant.updatedAt = new Date();
    const next = input.isOnline ? this.assignNextQueued(attendant.teamId) : null;
    const reassignment = input.isOnline
      ? { reassigned: [] as MemoryAttendance[], queued: [] as MemoryAttendance[] }
      : this.reassignActiveAttendancesFromOfflineAttendant(attendant);
    this.writeAuditEvent(
      input.isOnline ? "ATTENDANT_ONLINE" : "ATTENDANT_OFFLINE",
      "ATTENDANT",
      attendant.id,
      {
        teamId: attendant.teamId,
        reassigned: reassignment.reassigned.length,
        queued: reassignment.queued.length
      }
    );

    if (next) {
      this.writeAuditEvent("ATTENDANCE_ASSIGNED", "ATTENDANCE", next.id, {
        teamId: next.teamId,
        attendantId: next.attendantId,
        source: "ATTENDANT_ONLINE"
      });
    }
    const dto = this.toAttendantDto(attendant);
    const events: WorkflowEvent[] = [
      { name: "attendant.updated", payload: dto },
      { name: "queue.updated", payload: { teamId: attendant.teamId } },
      { name: "dashboard.updated", payload: {} }
    ];

    if (next) {
      events.splice(1, 0, {
        name: "attendance.assigned",
        payload: this.toAttendanceDto(next)
      });
    }

    for (const reassigned of reassignment.reassigned) {
      events.splice(1, 0, {
        name: "attendance.reassigned",
        payload: this.toAttendanceDto(reassigned)
      });
    }

    for (const queued of reassignment.queued) {
      events.splice(1, 0, {
        name: "attendance.queued",
        payload: this.toAttendanceDto(queued)
      });
    }

    return { data: dto, events };
  }

  async listTeams(): Promise<TeamDto[]> {
    return [...this.teams.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((team) => this.toTeamDto(team));
  }

  async getSummary(): Promise<DashboardSummaryDto> {
    const attendances = [...this.attendances.values()];
    const attendants = [...this.attendants.values()];
    const inProgress = attendances.filter(
      (attendance) => attendance.status === "IN_PROGRESS"
    ).length;
    const queued = attendances.filter(
      (attendance) => attendance.status === "QUEUED"
    ).length;
    const finished = attendances.filter(
      (attendance) => attendance.status === "FINISHED"
    ).length;
    const cancelled = attendances.filter(
      (attendance) => attendance.status === "CANCELLED"
    ).length;
    const onlineAttendants = attendants.filter(
      (attendant) => attendant.isOnline
    ).length;
    const totalCapacity = attendants
      .filter((attendant) => attendant.isOnline)
      .reduce((sum, attendant) => sum + attendant.maxConcurrentAttendances, 0);
    const waits = attendances
      .filter((attendance) => attendance.startedAt)
      .map((attendance) =>
        Math.max(
          0,
          ((attendance.startedAt as Date).getTime() -
            attendance.queuedAt.getTime()) /
            1000
        )
      );
    const averageWaitSeconds =
      waits.length > 0
        ? Math.round(waits.reduce((sum, wait) => sum + wait, 0) / waits.length)
        : 0;

    return {
      totalAttendances: attendances.length,
      inProgress,
      queued,
      finished,
      cancelled,
      onlineAttendants,
      totalCapacity,
      usedCapacity: inProgress,
      capacityUtilization:
        totalCapacity > 0 ? Math.round((inProgress / totalCapacity) * 100) : 0,
      averageWaitSeconds
    };
  }

  async getQueues(): Promise<QueueMetricDto[]> {
    return [...this.teams.values()].map((team) => {
      const queued = [...this.attendances.values()]
        .filter(
          (attendance) =>
            attendance.teamId === team.id && attendance.status === "QUEUED"
        )
        .sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime());

      return {
        teamId: team.id,
        teamName: team.name,
        teamType: team.type,
        queued: queued.length,
        oldestQueuedAt: queued[0]?.queuedAt.toISOString() ?? null
      };
    });
  }

  async getAttendantsLoad(): Promise<AttendantLoadDto[]> {
    return [...this.attendants.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((attendant) => {
        const team = this.mustGetTeam(attendant.teamId);
        const currentLoad = this.loadFor(attendant.id);
        return {
          attendantId: attendant.id,
          name: attendant.name,
          teamId: team.id,
          teamName: team.name,
          teamType: team.type,
          isOnline: attendant.isOnline,
          currentLoad,
          maxConcurrentAttendances: attendant.maxConcurrentAttendances,
          utilization: Math.round(
            (currentLoad / attendant.maxConcurrentAttendances) * 100
          )
        };
      });
  }

  async getRecentActivity(limit = 15): Promise<RecentActivityDto[]> {
    return [...this.attendances.values()]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit)
      .map((attendance) => {
        const team = this.mustGetTeam(attendance.teamId);
        const attendant = attendance.attendantId
          ? this.attendants.get(attendance.attendantId)
          : null;
        return {
          id: attendance.id,
          customerName: attendance.customerName,
          subject: attendance.subject,
          status: attendance.status,
          teamName: team.name,
          attendantName: attendant?.name ?? null,
          createdAt: attendance.createdAt.toISOString(),
          updatedAt: attendance.updatedAt.toISOString()
        };
      });
  }

  async listAuditEvents(
    query: AuditEventQuery
  ): Promise<PaginatedResponse<AuditEventDto>> {
    const filtered = [...this.auditEvents.values()]
      .filter((event) => {
        if (query.type && event.type !== query.type) return false;
        if (query.entityType && event.entityType !== query.entityType) {
          return false;
        }
        if (query.entityId && event.entityId !== query.entityId) return false;
        if (query.from && event.createdAt < new Date(query.from)) return false;
        if (query.to && event.createdAt > new Date(query.to)) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const start = (query.page - 1) * query.pageSize;
    const data = filtered
      .slice(start, start + query.pageSize)
      .map((event) => this.toAuditEventDto(event));

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / query.pageSize)
    };
  }

  async getOperationalMetrics(): Promise<OperationalMetricsDto> {
    return {
      ...(await this.getSummary()),
      generatedAt: new Date().toISOString()
    };
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = [...this.users.values()].find(
      (item) => item.email === email.toLowerCase()
    );

    return user ? this.toUserRecord(user) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = this.users.get(id);

    return user ? this.toUserRecord(user) : null;
  }

  async updateLastLogin(id: string, date: Date): Promise<void> {
    const user = this.users.get(id);

    if (user) {
      user.lastLoginAt = date;
      user.updatedAt = date;
    }
  }

  async createUser(input: CreateUserRecordInput): Promise<AuthUserDto> {
    if (await this.findByEmail(input.email)) {
      throw new ConflictError("User e-mail already exists");
    }

    const now = new Date();
    const user: MemoryUser = {
      id: this.nextId("user"),
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role,
      status: "ACTIVE",
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now
    };

    this.users.set(user.id, user);
    return this.toAuthUserDto(user);
  }

  private seed() {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const teamOrder: TeamType[] = ["CARDS", "LOANS", "OTHER"];

    for (const type of teamOrder) {
      const team: MemoryTeam = {
        id: `team-${type.toLowerCase()}`,
        name: TEAM_LABELS[type],
        type,
        subjectMatcher: SUBJECT_MATCHERS[type],
        roundRobinCursor: 0,
        createdAt: now,
        updatedAt: now
      };
      this.teams.set(team.id, team);
    }

    const names: Record<TeamType, string[]> = {
      CARDS: ["Ana Martins", "Bruno Rocha"],
      LOANS: ["Diego Alves", "Elisa Moraes"],
      OTHER: ["Gabriela Lima", "Henrique Costa"]
    };

    for (const [type, teamNames] of Object.entries(names) as [
      TeamType,
      string[]
    ][]) {
      const team = this.findTeamByType(type);
      for (const name of teamNames) {
        const attendant: MemoryAttendant = {
          id: this.nextId("agent"),
          name,
          teamId: team.id,
          isOnline: true,
          maxConcurrentAttendances: 3,
          createdAt: now,
          updatedAt: now
        };
        this.attendants.set(attendant.id, attendant);
      }
    }

    const demoUsers: Array<{
      id: string;
      name: string;
      email: string;
      password: string;
      role: AuthUserDto["role"];
    }> = [
      {
        id: "user-admin",
        name: "Lucas Almeida",
        email: "admin@nexora.local",
        password: "Admin@12345",
        role: "ADMIN"
      },
      {
        id: "user-supervisor",
        name: "Mariana Costa",
        email: "supervisor@nexora.local",
        password: "Supervisor@12345",
        role: "SUPERVISOR"
      }
    ];

    for (const user of demoUsers) {
      this.users.set(user.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: hashPasswordSync(user.password),
        role: user.role,
        status: "ACTIVE",
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  private assignNextQueued(teamId: string) {
    const assignment = this.pickAvailableAttendant(teamId);

    if (!assignment) {
      return null;
    }

    const nextQueued = [...this.attendances.values()]
      .filter(
        (attendance) =>
          attendance.teamId === teamId && attendance.status === "QUEUED"
      )
      .sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime())[0];

    if (!nextQueued) {
      return null;
    }

    const now = new Date();
    const team = this.mustGetTeam(teamId);
    team.roundRobinCursor = assignment.nextCursor;
    team.updatedAt = now;
    nextQueued.status = "IN_PROGRESS";
    nextQueued.attendantId = assignment.attendantId;
    nextQueued.startedAt = now;
    nextQueued.updatedAt = now;
    return nextQueued;
  }

  private reassignActiveAttendancesFromOfflineAttendant(
    attendant: MemoryAttendant
  ) {
    const activeAttendances = [...this.attendances.values()]
      .filter(
        (attendance) =>
          attendance.attendantId === attendant.id &&
          attendance.status === "IN_PROGRESS"
      )
      .sort((a, b) => {
        const startedDiff =
          (a.startedAt?.getTime() ?? 0) - (b.startedAt?.getTime() ?? 0);
        return startedDiff || a.createdAt.getTime() - b.createdAt.getTime();
      });
    const reassigned: MemoryAttendance[] = [];
    const queued: MemoryAttendance[] = [];

    for (const attendance of activeAttendances) {
      const now = new Date();
      const previousAttendantId = attendance.attendantId;
      const assignment = this.pickAvailableAttendant(attendant.teamId);

      if (assignment) {
        const team = this.mustGetTeam(attendant.teamId);
        team.roundRobinCursor = assignment.nextCursor;
        team.updatedAt = now;
        attendance.attendantId = assignment.attendantId;
        attendance.updatedAt = now;
        reassigned.push(attendance);
        this.writeAuditEvent(
          "ATTENDANCE_REASSIGNED",
          "ATTENDANCE",
          attendance.id,
          {
            teamId: attendance.teamId,
            previousAttendantId,
            attendantId: assignment.attendantId,
            reason: "ATTENDANT_OFFLINE"
          }
        );
      } else {
        attendance.status = "QUEUED";
        attendance.attendantId = null;
        attendance.queuedAt = now;
        attendance.startedAt = null;
        attendance.updatedAt = now;
        queued.push(attendance);
        this.writeAuditEvent("ATTENDANCE_QUEUED", "ATTENDANCE", attendance.id, {
          teamId: attendance.teamId,
          previousAttendantId,
          reason: "ATTENDANT_OFFLINE"
        });
      }
    }

    return { reassigned, queued };
  }

  private pickAvailableAttendant(teamId: string) {
    const team = this.mustGetTeam(teamId);
    const attendants = [...this.attendants.values()].filter(
      (attendant) => attendant.teamId === teamId
    );
    const loads = new Map<string, number>();

    for (const attendant of attendants) {
      loads.set(attendant.id, this.loadFor(attendant.id));
    }

    return this.distributionPolicy.selectAttendant(
      attendants.map((attendant): AssignableAttendant => ({ ...attendant })),
      loads,
      team.roundRobinCursor
    );
  }

  private loadFor(attendantId: string) {
    return [...this.attendances.values()].filter(
      (attendance) =>
        attendance.attendantId === attendantId &&
        attendance.status === "IN_PROGRESS"
    ).length;
  }

  private getMutableAttendance(id: string) {
    const attendance = this.attendances.get(id);

    if (!attendance) {
      throw new NotFoundError("Attendance");
    }

    return attendance;
  }

  private unchanged(attendance: MemoryAttendance, message: string) {
    return Promise.resolve({
      data: {
        attendance: this.toAttendanceDto(attendance),
        assignedAttendance: null,
        result: "UNCHANGED" as const,
        message
      },
      events: []
    });
  }

  private findTeamByType(type: TeamType) {
    const team = [...this.teams.values()].find((item) => item.type === type);

    if (!team) {
      throw new NotFoundError("Team");
    }

    return team;
  }

  private mustGetTeam(id: string) {
    const team = this.teams.get(id);

    if (!team) {
      throw new NotFoundError("Team");
    }

    return team;
  }

  private toTeamDto(team: MemoryTeam): TeamDto {
    return {
      id: team.id,
      name: team.name,
      type: team.type,
      subjectMatcher: team.subjectMatcher,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString()
    };
  }

  private toAttendantDto(attendant: MemoryAttendant): AttendantDto {
    const team = this.mustGetTeam(attendant.teamId);
    return {
      id: attendant.id,
      name: attendant.name,
      teamId: attendant.teamId,
      team: {
        id: team.id,
        name: team.name,
        type: team.type
      },
      isOnline: attendant.isOnline,
      maxConcurrentAttendances: attendant.maxConcurrentAttendances,
      currentLoad: this.loadFor(attendant.id),
      createdAt: attendant.createdAt.toISOString(),
      updatedAt: attendant.updatedAt.toISOString()
    };
  }

  private toAttendanceDto(attendance: MemoryAttendance): AttendanceDto {
    const team = this.mustGetTeam(attendance.teamId);
    const attendant = attendance.attendantId
      ? this.attendants.get(attendance.attendantId)
      : null;
    return {
      id: attendance.id,
      customerName: attendance.customerName,
      subject: attendance.subject,
      status: attendance.status,
      teamId: team.id,
      team: {
        id: team.id,
        name: team.name,
        type: team.type
      },
      attendantId: attendant?.id ?? null,
      attendant: attendant
        ? {
            id: attendant.id,
            name: attendant.name
          }
        : null,
      queuedAt: attendance.queuedAt.toISOString(),
      startedAt: attendance.startedAt?.toISOString() ?? null,
      finishedAt: attendance.finishedAt?.toISOString() ?? null,
      createdAt: attendance.createdAt.toISOString(),
      updatedAt: attendance.updatedAt.toISOString()
    };
  }

  private writeAuditEvent(
    type: AuditEventType,
    entityType: AuditEntityType,
    entityId: string,
    payload: unknown
  ) {
    const now = new Date();
    const event: MemoryAuditEvent = {
      id: this.nextId("audit"),
      type,
      entityType,
      entityId,
      payload,
      createdAt: now
    };
    this.auditEvents.set(event.id, event);
    return event;
  }

  private toAuditEventDto(event: MemoryAuditEvent): AuditEventDto {
    return {
      id: event.id,
      type: event.type,
      entityType: event.entityType,
      entityId: event.entityId,
      payload: event.payload,
      createdAt: event.createdAt.toISOString()
    };
  }

  private toAuthUserDto(user: MemoryUser): AuthUserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }

  private toUserRecord(user: MemoryUser): UserRecord {
    return {
      ...this.toAuthUserDto(user),
      passwordHash: user.passwordHash,
      status: user.status,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  private nextId(prefix: string) {
    this.sequence += 1;
    return `${prefix}-${this.sequence}`;
  }
}

export function createInMemoryContainer(
  realtime: RealtimePublisher = new NoopRealtimePublisher()
): AppContainer {
  const workflow = new InMemoryWorkflow();

  return {
    attendanceWorkflow: workflow,
    attendantWorkflow: workflow,
    teamQueries: workflow,
    dashboardQueries: workflow,
    auditQueries: workflow,
    metricsQueries: workflow,
    userRepository: workflow,
    realtime
  };
}
