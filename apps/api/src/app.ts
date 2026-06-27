import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastify, { type FastifyInstance } from "fastify";
import type { AppContainer } from "./application/contracts";
import type { AuthSessionConfig } from "./auth/session";
import { registerErrorHandler } from "./http/error-handler";
import { registerRoutes } from "./http/routes";

export interface BuildAppOptions {
  container: AppContainer;
  corsOrigin?: string | string[];
  logger?: boolean | { level: string };
  rateLimitMax?: number;
  rateLimitWindow?: string;
  auth?: Partial<AuthSessionConfig>;
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
  const authConfig: AuthSessionConfig = {
    secret: options.auth?.secret ?? "nexora-pulse-test-secret-change-me",
    cookieName: options.auth?.cookieName ?? "nexora_session",
    ttlHours: options.auth?.ttlHours ?? 8,
    secure: options.auth?.secure ?? process.env.NODE_ENV === "production",
    sameSite: options.auth?.sameSite ?? "lax"
  };

  await app.register(helmet, {
    contentSecurityPolicy: false
  });
  await app.register(cors, {
    origin: options.corsOrigin ?? [
      "http://localhost:5173",
      "http://localhost:5174"
    ],
    credentials: true
  });
  await app.register(rateLimit, {
    max: options.rateLimitMax ?? 120,
    timeWindow: options.rateLimitWindow ?? "1 minute"
  });
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Nexora Pulse API",
        description:
          "Routing, queueing, authentication and monitoring API for Nexora Pulse.",
        version: "1.0.0"
      },
      tags: [
        { name: "Health" },
        { name: "Auth" },
        { name: "Users" },
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
    authConfig,
    options.readiness ??
      (async () => ({
        ok: true,
        checks: { app: true }
      }))
  );

  return app;
}
