import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastify, { type FastifyInstance } from "fastify";
import type { AppContainer } from "./application/contracts";
import { registerErrorHandler } from "./http/error-handler";
import { registerRoutes } from "./http/routes";

export interface BuildAppOptions {
  container: AppContainer;
  corsOrigin?: string;
  logger?: boolean | { level: string };
  rateLimitMax?: number;
  rateLimitWindow?: string;
  readiness?: () => Promise<{ ok: boolean; checks: Record<string, boolean> }>;
}

export async function buildApp(
  options: BuildAppOptions
): Promise<FastifyInstance> {
  const app = fastify({
    logger: options.logger ?? false,
    genReqId: (request) =>
      request.headers["x-request-id"]?.toString() ?? crypto.randomUUID()
  });

  await app.register(helmet, {
    contentSecurityPolicy: false
  });
  await app.register(cors, {
    origin: options.corsOrigin ?? "http://localhost:5173",
    credentials: true
  });
  await app.register(rateLimit, {
    max: options.rateLimitMax ?? 120,
    timeWindow: options.rateLimitWindow ?? "1 minute"
  });
  await app.register(swagger, {
    openapi: {
      info: {
        title: "FlowPay Attendance Router API",
        description: "Routing, queueing and monitoring API for FlowPay support.",
        version: "1.0.0"
      },
      tags: [
        { name: "Health" },
        { name: "Teams" },
        { name: "Attendants" },
        { name: "Attendances" },
        { name: "Dashboard" },
        { name: "Audit" },
        { name: "Metrics" }
      ]
    }
  });
  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true
    }
  });

  registerErrorHandler(app);
  await registerRoutes(
    app,
    options.container,
    options.readiness ??
      (async () => ({
        ok: true,
        checks: { app: true }
      }))
  );

  return app;
}
