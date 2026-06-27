import { createClient } from "redis";
import { buildApp } from "./app";
import type { AuthSessionConfig } from "./auth/session";
import { verifySessionCookie } from "./auth/session";
import { loadEnv } from "./config/env";
import { createPrismaClient } from "./infrastructure/database/prisma";
import { createPrismaContainer } from "./infrastructure/repositories/prisma-workflow";
import { SocketRealtimePublisher } from "./infrastructure/realtime/socket-realtime-publisher";

const env = loadEnv();
const prisma = createPrismaClient();
const realtime = new SocketRealtimePublisher();
const corsOrigin = Array.from(new Set([...env.CORS_ORIGIN, env.WEB_ORIGIN]));
const auth: AuthSessionConfig = {
  secret: env.AUTH_SECRET,
  cookieName: env.AUTH_COOKIE_NAME,
  ttlHours: env.AUTH_SESSION_TTL_HOURS,
  secure: env.NODE_ENV === "production",
  sameSite: "lax"
};

async function readiness() {
  const checks: Record<string, boolean> = {
    database: false,
    redis: !env.REDIS_URL
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  if (env.REDIS_URL) {
    const client = createClient({ url: env.REDIS_URL });
    try {
      await client.connect();
      await client.ping();
      checks.redis = true;
    } catch {
      checks.redis = false;
    } finally {
      await client.quit().catch(() => undefined);
    }
  }

  return {
    ok: Object.values(checks).every(Boolean),
    checks
  };
}

async function main() {
  const app = await buildApp({
    container: createPrismaContainer(prisma, realtime),
    corsOrigin,
    logger: { level: env.LOG_LEVEL },
    rateLimitMax: env.RATE_LIMIT_MAX,
    rateLimitWindow: env.RATE_LIMIT_WINDOW,
    auth,
    readiness
  });

  await realtime.attach(app.server, {
    corsOrigin,
    redisUrl: env.REDIS_URL,
    logger: app.log,
    authenticate: (cookieHeader) => Boolean(verifySessionCookie(cookieHeader, auth))
  });

  const close = async () => {
    app.log.info("Shutting down API");
    await realtime.close();
    await prisma.$disconnect();
    await app.close();
  };

  process.on("SIGINT", () => {
    close().finally(() => process.exit(0));
  });
  process.on("SIGTERM", () => {
    close().finally(() => process.exit(0));
  });

  await app.listen({ port: env.PORT, host: env.HOST });
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
