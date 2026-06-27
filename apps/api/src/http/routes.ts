import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  auditEventQuerySchema,
  attendanceQuerySchema,
  createUserSchema,
  createAttendanceSchema,
  createAttendantSchema,
  loginSchema,
  updateAttendantStatusSchema
} from "@flowpay/shared";
import type {
  AuthUserDto,
  OperationalMetricsDto,
  UserRole
} from "@flowpay/shared";
import { z } from "zod";
import type { AppContainer } from "../application/contracts";
import { hashPassword, verifyPassword } from "../auth/password";
import type { AuthSessionConfig } from "../auth/session";
import {
  createSessionToken,
  serializeClearSessionCookie,
  serializeSessionCookie,
  verifySessionCookie
} from "../auth/session";
import { ListAuditEventsUseCase } from "../application/use-cases/audit-use-cases";
import {
  CancelAttendanceUseCase,
  CreateAttendanceUseCase,
  FinishAttendanceUseCase,
  GetAttendanceUseCase,
  ListAttendancesUseCase
} from "../application/use-cases/attendance-use-cases";
import {
  CreateAttendantUseCase,
  ListAttendantsUseCase,
  UpdateAttendantStatusUseCase
} from "../application/use-cases/attendant-use-cases";
import {
  GetAttendantsLoadUseCase,
  GetDashboardQueuesUseCase,
  GetDashboardSummaryUseCase,
  GetRecentActivityUseCase
} from "../application/use-cases/dashboard-use-cases";
import { GetOperationalMetricsUseCase } from "../application/use-cases/metrics-use-cases";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError
} from "../domain/errors";
import {
  auditEventQueryJsonSchema,
  attendanceQueryJsonSchema,
  createAttendanceJsonSchema,
  createAttendantJsonSchema,
  idParamSchema,
  updateAttendantStatusJsonSchema
} from "./schemas";

const idParams = z.object({ id: z.string().min(1) });
const recentQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(15)
});

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUserDto;
  }
}

const loginJsonSchema = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1 }
  },
  additionalProperties: false
};

const createUserJsonSchema = {
  type: "object",
  required: ["name", "email", "password", "role"],
  properties: {
    name: { type: "string", minLength: 2, maxLength: 120 },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 10, maxLength: 160 },
    role: { type: "string", enum: ["ADMIN", "SUPERVISOR"] }
  },
  additionalProperties: false
};

export async function registerRoutes(
  app: FastifyInstance,
  container: AppContainer,
  authConfig: AuthSessionConfig,
  readiness: () => Promise<{ ok: boolean; checks: Record<string, boolean> }>
) {
  const createAttendance = new CreateAttendanceUseCase(
    container.attendanceWorkflow,
    container.realtime
  );
  const finishAttendance = new FinishAttendanceUseCase(
    container.attendanceWorkflow,
    container.realtime
  );
  const cancelAttendance = new CancelAttendanceUseCase(
    container.attendanceWorkflow,
    container.realtime
  );
  const listAttendances = new ListAttendancesUseCase(
    container.attendanceWorkflow
  );
  const getAttendance = new GetAttendanceUseCase(container.attendanceWorkflow);
  const listAttendants = new ListAttendantsUseCase(container.attendantWorkflow);
  const createAttendant = new CreateAttendantUseCase(
    container.attendantWorkflow,
    container.realtime
  );
  const updateAttendantStatus = new UpdateAttendantStatusUseCase(
    container.attendantWorkflow,
    container.realtime
  );
  const dashboardSummary = new GetDashboardSummaryUseCase(
    container.dashboardQueries
  );
  const dashboardQueues = new GetDashboardQueuesUseCase(
    container.dashboardQueries
  );
  const attendantsLoad = new GetAttendantsLoadUseCase(
    container.dashboardQueries
  );
  const recentActivity = new GetRecentActivityUseCase(
    container.dashboardQueries
  );
  const listAuditEvents = new ListAuditEventsUseCase(container.auditQueries);
  const operationalMetrics = new GetOperationalMetricsUseCase(
    container.metricsQueries
  );
  const toAuthUser = (user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }): AuthUserDto => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
  const requireAuth = async (request: FastifyRequest) => {
    const sessionUser = verifySessionCookie(request.headers.cookie, authConfig);

    if (!sessionUser) {
      throw new UnauthorizedError();
    }

    const user = await container.userRepository.findById(sessionUser.id);

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedError();
    }

    request.authUser = toAuthUser(user);
  };
  const requireRole =
    (...roles: UserRole[]) =>
    async (request: FastifyRequest) => {
      await requireAuth(request);

      if (!request.authUser || !roles.includes(request.authUser.role)) {
        throw new ForbiddenError();
      }
    };
  const authenticated = { preHandler: requireAuth };
  const adminOnly = { preHandler: requireRole("ADMIN") };

  app.get(
    "/",
    {
      schema: {
        tags: ["Health"],
        hide: true
      }
    },
    async (_request, reply) => reply.redirect("/docs")
  );

  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              uptime: { type: "number" }
            }
          }
        }
      }
    },
    async () => ({ status: "ok", uptime: process.uptime() })
  );

  app.get(
    "/ready",
    {
      schema: {
        tags: ["Health"]
      }
    },
    async (_request, reply) => {
      const result = await readiness();
      return reply.status(result.ok ? 200 : 503).send(result);
    }
  );

  app.post(
    "/api/v1/auth/login",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute"
        }
      },
      schema: {
        tags: ["Auth"],
        body: loginJsonSchema
      }
    },
    async (request, reply) => {
      const input = loginSchema.parse(request.body);
      const user = await container.userRepository.findByEmail(input.email);
      const validPassword = user
        ? await verifyPassword(input.password, user.passwordHash)
        : false;

      if (!user || user.status !== "ACTIVE" || !validPassword) {
        throw new UnauthorizedError("Credenciais inválidas");
      }

      await container.userRepository.updateLastLogin(user.id, new Date());
      const authUser = toAuthUser(user);
      const token = createSessionToken(authUser, authConfig);

      return reply
        .header("Set-Cookie", serializeSessionCookie(token, authConfig))
        .send({ user: authUser });
    }
  );

  app.get(
    "/api/v1/auth/me",
    {
      ...authenticated,
      schema: {
        tags: ["Auth"]
      }
    },
    async (request) => ({ user: request.authUser })
  );

  app.post(
    "/api/v1/auth/logout",
    {
      schema: {
        tags: ["Auth"]
      }
    },
    async (_request, reply) =>
      reply
        .header("Set-Cookie", serializeClearSessionCookie(authConfig))
        .send({ ok: true })
  );

  app.post(
    "/api/v1/users",
    {
      ...adminOnly,
      schema: {
        tags: ["Users"],
        body: createUserJsonSchema
      }
    },
    async (request, reply) => {
      const input = createUserSchema.parse(request.body);
      const existingUser = await container.userRepository.findByEmail(
        input.email
      );

      if (existingUser) {
        throw new ConflictError("User e-mail already exists");
      }

      const user = await container.userRepository.createUser({
        ...input,
        passwordHash: await hashPassword(input.password)
      });

      return reply.status(201).send({ user });
    }
  );

  app.get(
    "/api/v1/teams",
    {
      ...authenticated,
      schema: {
        tags: ["Teams"]
      }
    },
    async () => container.teamQueries.listTeams()
  );

  app.get(
    "/api/v1/attendants",
    {
      ...authenticated,
      schema: {
        tags: ["Attendants"]
      }
    },
    async () => listAttendants.execute()
  );

  app.post(
    "/api/v1/attendants",
    {
      ...adminOnly,
      schema: {
        tags: ["Attendants"],
        body: createAttendantJsonSchema
      }
    },
    async (request, reply) => {
      const input = createAttendantSchema.parse(request.body);
      const result = await createAttendant.execute(input);
      return reply.status(201).send(result);
    }
  );

  app.patch(
    "/api/v1/attendants/:id/status",
    {
      ...adminOnly,
      schema: {
        tags: ["Attendants"],
        params: idParamSchema,
        body: updateAttendantStatusJsonSchema
      }
    },
    async (request) => {
      const { id } = idParams.parse(request.params);
      const input = updateAttendantStatusSchema.parse(request.body);
      return updateAttendantStatus.execute(id, input);
    }
  );

  app.post(
    "/api/v1/attendances",
    {
      ...authenticated,
      schema: {
        tags: ["Attendances"],
        body: createAttendanceJsonSchema
      }
    },
    async (request, reply) => {
      const input = createAttendanceSchema.parse(request.body);
      const result = await createAttendance.execute(input);
      return reply.status(201).send(result);
    }
  );

  app.get(
    "/api/v1/attendances",
    {
      ...authenticated,
      schema: {
        tags: ["Attendances"],
        querystring: attendanceQueryJsonSchema
      }
    },
    async (request) => {
      const query = attendanceQuerySchema.parse(request.query);
      return listAttendances.execute(query);
    }
  );

  app.get(
    "/api/v1/attendances/:id",
    {
      ...authenticated,
      schema: {
        tags: ["Attendances"],
        params: idParamSchema
      }
    },
    async (request) => {
      const { id } = idParams.parse(request.params);
      const attendance = await getAttendance.execute(id);

      if (!attendance) {
        throw new NotFoundError("Attendance");
      }

      return attendance;
    }
  );

  app.patch(
    "/api/v1/attendances/:id/finish",
    {
      ...authenticated,
      schema: {
        tags: ["Attendances"],
        params: idParamSchema
      }
    },
    async (request) => {
      const { id } = idParams.parse(request.params);
      return finishAttendance.execute(id);
    }
  );

  app.patch(
    "/api/v1/attendances/:id/cancel",
    {
      ...authenticated,
      schema: {
        tags: ["Attendances"],
        params: idParamSchema
      }
    },
    async (request) => {
      const { id } = idParams.parse(request.params);
      return cancelAttendance.execute(id);
    }
  );

  app.get(
    "/api/v1/dashboard/summary",
    {
      ...authenticated,
      schema: {
        tags: ["Dashboard"]
      }
    },
    async () => dashboardSummary.execute()
  );

  app.get(
    "/api/v1/dashboard/queues",
    {
      ...authenticated,
      schema: {
        tags: ["Dashboard"]
      }
    },
    async () => dashboardQueues.execute()
  );

  app.get(
    "/api/v1/dashboard/attendants-load",
    {
      ...authenticated,
      schema: {
        tags: ["Dashboard"]
      }
    },
    async () => attendantsLoad.execute()
  );

  app.get(
    "/api/v1/dashboard/recent-activity",
    {
      ...authenticated,
      schema: {
        tags: ["Dashboard"],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 50, default: 15 }
          }
        }
      }
    },
    async (request) => {
      const { limit } = recentQuery.parse(request.query);
      return recentActivity.execute(limit);
    }
  );

  app.get(
    "/api/v1/audit-events",
    {
      ...authenticated,
      schema: {
        tags: ["Audit"],
        querystring: auditEventQueryJsonSchema
      }
    },
    async (request) => {
      const query = auditEventQuerySchema.parse(request.query);
      return listAuditEvents.execute(query);
    }
  );

  app.get(
    "/api/v1/metrics",
    {
      ...authenticated,
      schema: {
        tags: ["Metrics"]
      }
    },
    async () => operationalMetrics.execute()
  );

  app.get(
    "/metrics",
    {
      schema: {
        tags: ["Metrics"]
      }
    },
    async (_request, reply) => {
      const metrics = await operationalMetrics.execute();
      return reply
        .type("text/plain; version=0.0.4")
        .send(formatPrometheusMetrics(metrics));
    }
  );
}

function formatPrometheusMetrics(metrics: OperationalMetricsDto) {
  return [
    "# HELP nexora_attendances_total Total attendances recorded.",
    "# TYPE nexora_attendances_total gauge",
    `nexora_attendances_total ${metrics.totalAttendances}`,
    "# HELP nexora_attendances_in_progress Current in-progress attendances.",
    "# TYPE nexora_attendances_in_progress gauge",
    `nexora_attendances_in_progress ${metrics.inProgress}`,
    "# HELP nexora_attendances_queued Current queued attendances.",
    "# TYPE nexora_attendances_queued gauge",
    `nexora_attendances_queued ${metrics.queued}`,
    "# HELP nexora_attendances_finished Finished attendances.",
    "# TYPE nexora_attendances_finished gauge",
    `nexora_attendances_finished ${metrics.finished}`,
    "# HELP nexora_attendants_online Online attendants.",
    "# TYPE nexora_attendants_online gauge",
    `nexora_attendants_online ${metrics.onlineAttendants}`,
    "# HELP nexora_attendants_capacity_used Used attendant capacity.",
    "# TYPE nexora_attendants_capacity_used gauge",
    `nexora_attendants_capacity_used ${metrics.usedCapacity}`,
    "# HELP nexora_average_wait_time_seconds Average wait time in seconds.",
    "# TYPE nexora_average_wait_time_seconds gauge",
    `nexora_average_wait_time_seconds ${metrics.averageWaitSeconds}`,
    ""
  ].join("\n");
}
