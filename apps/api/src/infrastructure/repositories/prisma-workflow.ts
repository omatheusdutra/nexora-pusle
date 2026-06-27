import type {
  AttendantDto,
  AttendantLoadDto,
  AttendanceDto,
  AttendanceQuery,
  CreateAttendanceInput,
  CreateAttendantInput,
  DashboardSummaryDto,
  PaginatedResponse,
  QueueMetricDto,
  RecentActivityDto,
  RouteAttendanceResult,
  TeamDto,
  TeamType,
  UpdateAttendantStatusInput
} from "@flowpay/shared";
import { Prisma, PrismaClient } from "@prisma/client";
import type {
  AppContainer,
  AttendantWorkflow,
  AttendanceWorkflow,
  DashboardQueries,
  RealtimePublisher,
  TeamQueries,
  WorkflowEvent,
  WorkflowResult
} from "../../application/contracts";
import { DistributionPolicy } from "../../domain/distribution-policy";
import { ConflictError, NotFoundError } from "../../domain/errors";
import { SubjectRouter } from "../../domain/subject-router";

const attendanceInclude = {
  team: true,
  attendant: true
} satisfies Prisma.AttendanceInclude;

const attendantInclude = {
  team: true
} satisfies Prisma.AttendantInclude;

type PrismaTransaction = Prisma.TransactionClient;
type LoadedAttendance = Prisma.AttendanceGetPayload<{
  include: typeof attendanceInclude;
}>;
type LoadedAttendant = Prisma.AttendantGetPayload<{
  include: typeof attendantInclude;
}>;
type LoadedTeam = Prisma.TeamGetPayload<Record<string, never>>;

export class PrismaWorkflow
  implements AttendanceWorkflow, AttendantWorkflow, TeamQueries, DashboardQueries
{
  private readonly subjectRouter = new SubjectRouter();
  private readonly distributionPolicy = new DistributionPolicy();

  constructor(private readonly prisma: PrismaClient) {}

  async createAttendance(
    input: CreateAttendanceInput
  ): Promise<WorkflowResult<RouteAttendanceResult>> {
    const result = await this.prisma.$transaction(async (tx) => {
      const teamType = this.subjectRouter.resolve(input.subject);
      const teamLookup = await tx.team.findUnique({
        where: { type: teamType }
      });

      if (!teamLookup) {
        throw new NotFoundError("Team");
      }

      await this.lockTeamForAssignment(tx, teamLookup.id);
      const team = await tx.team.findUniqueOrThrow({
        where: { id: teamLookup.id }
      });
      const assignment = await this.pickAvailableAttendant(
        tx,
        team.id,
        team.roundRobinCursor
      );
      const now = new Date();
      const attendance = await tx.attendance.create({
        data: {
          customerName: input.customerName,
          subject: input.subject,
          status: assignment ? "IN_PROGRESS" : "QUEUED",
          teamId: team.id,
          attendantId: assignment?.attendantId ?? null,
          queuedAt: now,
          startedAt: assignment ? now : null
        },
        include: attendanceInclude
      });

      if (assignment) {
        await tx.team.update({
          where: { id: team.id },
          data: { roundRobinCursor: assignment.nextCursor }
        });
      }

      return {
        attendance,
        assigned: Boolean(assignment)
      };
    });

    const dto = this.toAttendanceDto(result.attendance);
    const events: WorkflowEvent[] = [
      { name: "attendance.created", payload: dto },
      {
        name: result.assigned ? "attendance.assigned" : "attendance.queued",
        payload: dto
      },
      { name: "queue.updated", payload: { teamId: dto.teamId } },
      { name: "dashboard.updated", payload: {} }
    ];

    return {
      data: {
        attendance: dto,
        result: result.assigned ? "ASSIGNED" : "QUEUED",
        message: result.assigned
          ? "Attendance assigned automatically"
          : "Attendance queued because team capacity is full"
      },
      events
    };
  }

  async finishAttendance(
    id: string
  ): Promise<WorkflowResult<RouteAttendanceResult>> {
    const result = await this.prisma.$transaction(async (tx) => {
      await this.lockAttendance(tx, id);
      const attendance = await tx.attendance.findUnique({
        where: { id },
        include: attendanceInclude
      });

      if (!attendance) {
        throw new NotFoundError("Attendance");
      }

      if (attendance.status === "FINISHED") {
        return {
          attendance,
          assignedAttendance: null,
          unchanged: true
        };
      }

      if (attendance.status !== "IN_PROGRESS") {
        throw new ConflictError("Only in-progress attendances can be finished");
      }

      await this.lockTeamForAssignment(tx, attendance.teamId);
      const finished = await tx.attendance.update({
        where: { id },
        data: {
          status: "FINISHED",
          finishedAt: new Date()
        },
        include: attendanceInclude
      });
      const assignedAttendance = await this.assignNextQueued(tx, attendance.teamId);

      return {
        attendance: finished,
        assignedAttendance,
        unchanged: false
      };
    });

    const dto = this.toAttendanceDto(result.attendance);

    if (result.unchanged) {
      return {
        data: {
          attendance: dto,
          assignedAttendance: null,
          result: "UNCHANGED",
          message: "Attendance already finished"
        },
        events: []
      };
    }

    const assignedDto = result.assignedAttendance
      ? this.toAttendanceDto(result.assignedAttendance)
      : null;
    const events: WorkflowEvent[] = [
      { name: "attendance.finished", payload: dto },
      { name: "queue.updated", payload: { teamId: dto.teamId } },
      { name: "dashboard.updated", payload: {} }
    ];

    if (assignedDto) {
      events.splice(1, 0, {
        name: "attendance.assigned",
        payload: assignedDto
      });
    }

    return {
      data: {
        attendance: dto,
        assignedAttendance: assignedDto,
        result: "FINISHED",
        message: assignedDto
          ? "Attendance finished and next queued attendance assigned"
          : "Attendance finished"
      },
      events
    };
  }

  async cancelAttendance(
    id: string
  ): Promise<WorkflowResult<RouteAttendanceResult>> {
    const result = await this.prisma.$transaction(async (tx) => {
      await this.lockAttendance(tx, id);
      const attendance = await tx.attendance.findUnique({
        where: { id },
        include: attendanceInclude
      });

      if (!attendance) {
        throw new NotFoundError("Attendance");
      }

      if (attendance.status === "CANCELLED") {
        return {
          attendance,
          assignedAttendance: null,
          unchanged: true
        };
      }

      if (attendance.status === "FINISHED") {
        throw new ConflictError("Finished attendances cannot be cancelled");
      }

      const shouldPullNext = attendance.status === "IN_PROGRESS";
      await this.lockTeamForAssignment(tx, attendance.teamId);
      const cancelled = await tx.attendance.update({
        where: { id },
        data: {
          status: "CANCELLED",
          finishedAt: new Date()
        },
        include: attendanceInclude
      });
      const assignedAttendance = shouldPullNext
        ? await this.assignNextQueued(tx, attendance.teamId)
        : null;

      return {
        attendance: cancelled,
        assignedAttendance,
        unchanged: false
      };
    });

    const dto = this.toAttendanceDto(result.attendance);

    if (result.unchanged) {
      return {
        data: {
          attendance: dto,
          assignedAttendance: null,
          result: "UNCHANGED",
          message: "Attendance already cancelled"
        },
        events: []
      };
    }

    const assignedDto = result.assignedAttendance
      ? this.toAttendanceDto(result.assignedAttendance)
      : null;
    const events: WorkflowEvent[] = [
      { name: "attendance.cancelled", payload: dto },
      { name: "queue.updated", payload: { teamId: dto.teamId } },
      { name: "dashboard.updated", payload: {} }
    ];

    if (assignedDto) {
      events.splice(1, 0, {
        name: "attendance.assigned",
        payload: assignedDto
      });
    }

    return {
      data: {
        attendance: dto,
        assignedAttendance: assignedDto,
        result: "CANCELLED",
        message: assignedDto
          ? "Attendance cancelled and next queued attendance assigned"
          : "Attendance cancelled"
      },
      events
    };
  }

  async listAttendances(
    query: AttendanceQuery
  ): Promise<PaginatedResponse<AttendanceDto>> {
    const where: Prisma.AttendanceWhereInput = {
      status: query.status,
      teamId: query.teamId,
      attendantId: query.attendantId,
      subject: query.subject
        ? {
            contains: query.subject,
            mode: "insensitive"
          }
        : undefined
    };
    const skip = (query.page - 1) * query.pageSize;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.findMany({
        where,
        include: attendanceInclude,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: query.pageSize
      })
    ]);

    return {
      data: data.map((attendance) => this.toAttendanceDto(attendance)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize)
    };
  }

  async getAttendance(id: string): Promise<AttendanceDto | null> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: attendanceInclude
    });

    return attendance ? this.toAttendanceDto(attendance) : null;
  }

  async listAttendants(): Promise<AttendantDto[]> {
    const attendants = await this.prisma.attendant.findMany({
      include: attendantInclude,
      orderBy: [{ team: { name: "asc" } }, { name: "asc" }]
    });
    const loads = await this.getLoadMap(this.prisma);

    return attendants.map((attendant) =>
      this.toAttendantDto(attendant, loads.get(attendant.id) ?? 0)
    );
  }

  async createAttendant(
    input: CreateAttendantInput
  ): Promise<WorkflowResult<AttendantDto>> {
    const result = await this.prisma.$transaction(async (tx) => {
      const team = await tx.team.findUnique({
        where: { id: input.teamId }
      });

      if (!team) {
        throw new NotFoundError("Team");
      }

      await this.lockTeamForAssignment(tx, input.teamId);
      const attendant = await tx.attendant.create({
        data: input,
        include: attendantInclude
      });
      const assignedAttendance = input.isOnline
        ? await this.assignNextQueued(tx, input.teamId)
        : null;
      const loads = await this.getLoadMap(tx, input.teamId);

      return {
        attendant,
        currentLoad: loads.get(attendant.id) ?? 0,
        assignedAttendance
      };
    });

    const dto = this.toAttendantDto(result.attendant, result.currentLoad);
    const events: WorkflowEvent[] = [
      { name: "attendant.updated", payload: dto },
      { name: "queue.updated", payload: { teamId: dto.teamId } },
      { name: "dashboard.updated", payload: {} }
    ];

    if (result.assignedAttendance) {
      events.splice(1, 0, {
        name: "attendance.assigned",
        payload: this.toAttendanceDto(result.assignedAttendance)
      });
    }

    return { data: dto, events };
  }

  async updateAttendantStatus(
    id: string,
    input: UpdateAttendantStatusInput
  ): Promise<WorkflowResult<AttendantDto>> {
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.attendant.findUnique({
        where: { id },
        include: attendantInclude
      });

      if (!current) {
        throw new NotFoundError("Attendant");
      }

      await this.lockTeamForAssignment(tx, current.teamId);
      const attendant = await tx.attendant.update({
        where: { id },
        data: { isOnline: input.isOnline },
        include: attendantInclude
      });
      const assignedAttendance = input.isOnline
        ? await this.assignNextQueued(tx, attendant.teamId)
        : null;
      const loads = await this.getLoadMap(tx, attendant.teamId);

      return {
        attendant,
        currentLoad: loads.get(attendant.id) ?? 0,
        assignedAttendance
      };
    });

    const dto = this.toAttendantDto(result.attendant, result.currentLoad);
    const events: WorkflowEvent[] = [
      { name: "attendant.updated", payload: dto },
      { name: "queue.updated", payload: { teamId: dto.teamId } },
      { name: "dashboard.updated", payload: {} }
    ];

    if (result.assignedAttendance) {
      events.splice(1, 0, {
        name: "attendance.assigned",
        payload: this.toAttendanceDto(result.assignedAttendance)
      });
    }

    return { data: dto, events };
  }

  async listTeams(): Promise<TeamDto[]> {
    const teams = await this.prisma.team.findMany({
      orderBy: [{ name: "asc" }]
    });

    return teams.map((team) => this.toTeamDto(team));
  }

  async getSummary(): Promise<DashboardSummaryDto> {
    const [
      totalAttendances,
      inProgress,
      queued,
      finished,
      cancelled,
      onlineAttendants,
      attendants,
      startedAttendances
    ] = await Promise.all([
      this.prisma.attendance.count(),
      this.prisma.attendance.count({ where: { status: "IN_PROGRESS" } }),
      this.prisma.attendance.count({ where: { status: "QUEUED" } }),
      this.prisma.attendance.count({ where: { status: "FINISHED" } }),
      this.prisma.attendance.count({ where: { status: "CANCELLED" } }),
      this.prisma.attendant.count({ where: { isOnline: true } }),
      this.prisma.attendant.findMany({ where: { isOnline: true } }),
      this.prisma.attendance.findMany({
        where: { startedAt: { not: null } },
        select: { queuedAt: true, startedAt: true },
        take: 500,
        orderBy: { startedAt: "desc" }
      })
    ]);
    const totalCapacity = attendants.reduce(
      (sum, attendant) => sum + attendant.maxConcurrentAttendances,
      0
    );
    const waits = startedAttendances.map((attendance) =>
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
      totalAttendances,
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
    const teams = await this.prisma.team.findMany({
      orderBy: { name: "asc" }
    });

    return Promise.all(
      teams.map(async (team) => {
        const [queued, oldest] = await Promise.all([
          this.prisma.attendance.count({
            where: { teamId: team.id, status: "QUEUED" }
          }),
          this.prisma.attendance.findFirst({
            where: { teamId: team.id, status: "QUEUED" },
            orderBy: [{ queuedAt: "asc" }, { createdAt: "asc" }],
            select: { queuedAt: true }
          })
        ]);

        return {
          teamId: team.id,
          teamName: team.name,
          teamType: team.type as TeamType,
          queued,
          oldestQueuedAt: oldest?.queuedAt.toISOString() ?? null
        };
      })
    );
  }

  async getAttendantsLoad(): Promise<AttendantLoadDto[]> {
    const attendants = await this.prisma.attendant.findMany({
      include: attendantInclude,
      orderBy: [{ team: { name: "asc" } }, { name: "asc" }]
    });
    const loads = await this.getLoadMap(this.prisma);

    return attendants.map((attendant) => {
      const currentLoad = loads.get(attendant.id) ?? 0;

      return {
        attendantId: attendant.id,
        name: attendant.name,
        teamId: attendant.teamId,
        teamName: attendant.team.name,
        teamType: attendant.team.type as TeamType,
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
    const attendances = await this.prisma.attendance.findMany({
      include: attendanceInclude,
      orderBy: [{ updatedAt: "desc" }],
      take: limit
    });

    return attendances.map((attendance) => ({
      id: attendance.id,
      customerName: attendance.customerName,
      subject: attendance.subject,
      status: attendance.status,
      teamName: attendance.team.name,
      attendantName: attendance.attendant?.name ?? null,
      createdAt: attendance.createdAt.toISOString(),
      updatedAt: attendance.updatedAt.toISOString()
    }));
  }

  private async assignNextQueued(tx: PrismaTransaction, teamId: string) {
    const nextQueued = await tx.attendance.findFirst({
      where: { teamId, status: "QUEUED" },
      orderBy: [{ queuedAt: "asc" }, { createdAt: "asc" }]
    });

    if (!nextQueued) {
      return null;
    }

    const team = await tx.team.findUniqueOrThrow({ where: { id: teamId } });
    const assignment = await this.pickAvailableAttendant(
      tx,
      teamId,
      team.roundRobinCursor
    );

    if (!assignment) {
      return null;
    }

    const now = new Date();
    const updated = await tx.attendance.update({
      where: { id: nextQueued.id },
      data: {
        status: "IN_PROGRESS",
        attendantId: assignment.attendantId,
        startedAt: now
      },
      include: attendanceInclude
    });
    await tx.team.update({
      where: { id: teamId },
      data: { roundRobinCursor: assignment.nextCursor }
    });

    return updated;
  }

  private async pickAvailableAttendant(
    tx: PrismaTransaction,
    teamId: string,
    roundRobinCursor: number
  ) {
    const attendants = await tx.attendant.findMany({
      where: { teamId, isOnline: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    const loads = await this.getLoadMap(tx, teamId);

    return this.distributionPolicy.selectAttendant(
      attendants.map((attendant) => ({
        id: attendant.id,
        name: attendant.name,
        isOnline: attendant.isOnline,
        maxConcurrentAttendances: attendant.maxConcurrentAttendances,
        createdAt: attendant.createdAt
      })),
      loads,
      roundRobinCursor
    );
  }

  private async getLoadMap(
    client: PrismaClient | PrismaTransaction,
    teamId?: string
  ) {
    const groups = await client.attendance.groupBy({
      by: ["attendantId"],
      where: {
        teamId,
        status: "IN_PROGRESS",
        attendantId: { not: null }
      },
      _count: { _all: true }
    });
    const loads = new Map<string, number>();

    for (const group of groups) {
      if (group.attendantId) {
        loads.set(group.attendantId, group._count._all);
      }
    }

    return loads;
  }

  private async lockTeamForAssignment(tx: PrismaTransaction, teamId: string) {
    await tx.$queryRaw`SELECT id FROM "Team" WHERE id = ${teamId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "Attendant" WHERE "teamId" = ${teamId} FOR UPDATE`;
  }

  private async lockAttendance(tx: PrismaTransaction, attendanceId: string) {
    await tx.$queryRaw`SELECT id FROM "Attendance" WHERE id = ${attendanceId} FOR UPDATE`;
  }

  private toTeamDto(team: LoadedTeam): TeamDto {
    return {
      id: team.id,
      name: team.name,
      type: team.type as TeamType,
      subjectMatcher: team.subjectMatcher,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString()
    };
  }

  private toAttendantDto(
    attendant: LoadedAttendant,
    currentLoad: number
  ): AttendantDto {
    return {
      id: attendant.id,
      name: attendant.name,
      teamId: attendant.teamId,
      team: {
        id: attendant.team.id,
        name: attendant.team.name,
        type: attendant.team.type as TeamType
      },
      isOnline: attendant.isOnline,
      maxConcurrentAttendances: attendant.maxConcurrentAttendances,
      currentLoad,
      createdAt: attendant.createdAt.toISOString(),
      updatedAt: attendant.updatedAt.toISOString()
    };
  }

  private toAttendanceDto(attendance: LoadedAttendance): AttendanceDto {
    return {
      id: attendance.id,
      customerName: attendance.customerName,
      subject: attendance.subject,
      status: attendance.status,
      teamId: attendance.teamId,
      team: {
        id: attendance.team.id,
        name: attendance.team.name,
        type: attendance.team.type as TeamType
      },
      attendantId: attendance.attendantId,
      attendant: attendance.attendant
        ? {
            id: attendance.attendant.id,
            name: attendance.attendant.name
          }
        : null,
      queuedAt: attendance.queuedAt.toISOString(),
      startedAt: attendance.startedAt?.toISOString() ?? null,
      finishedAt: attendance.finishedAt?.toISOString() ?? null,
      createdAt: attendance.createdAt.toISOString(),
      updatedAt: attendance.updatedAt.toISOString()
    };
  }
}

export function createPrismaContainer(
  prisma: PrismaClient,
  realtime: RealtimePublisher
): AppContainer {
  const workflow = new PrismaWorkflow(prisma);

  return {
    attendanceWorkflow: workflow,
    attendantWorkflow: workflow,
    teamQueries: workflow,
    dashboardQueries: workflow,
    realtime
  };
}
