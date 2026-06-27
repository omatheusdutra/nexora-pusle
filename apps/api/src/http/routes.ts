import type { FastifyInstance } from "fastify";
import {
  attendanceQuerySchema,
  createAttendanceSchema,
  createAttendantSchema,
  updateAttendantStatusSchema
} from "@flowpay/shared";
import { z } from "zod";
import type { AppContainer } from "../application/contracts";
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
import { NotFoundError } from "../domain/errors";
import {
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

export async function registerRoutes(
  app: FastifyInstance,
  container: AppContainer,
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

  app.get(
    "/api/v1/teams",
    {
      schema: {
        tags: ["Teams"]
      }
    },
    async () => container.teamQueries.listTeams()
  );

  app.get(
    "/api/v1/attendants",
    {
      schema: {
        tags: ["Attendants"]
      }
    },
    async () => listAttendants.execute()
  );

  app.post(
    "/api/v1/attendants",
    {
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
      schema: {
        tags: ["Dashboard"]
      }
    },
    async () => dashboardSummary.execute()
  );

  app.get(
    "/api/v1/dashboard/queues",
    {
      schema: {
        tags: ["Dashboard"]
      }
    },
    async () => dashboardQueues.execute()
  );

  app.get(
    "/api/v1/dashboard/attendants-load",
    {
      schema: {
        tags: ["Dashboard"]
      }
    },
    async () => attendantsLoad.execute()
  );

  app.get(
    "/api/v1/dashboard/recent-activity",
    {
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
}
