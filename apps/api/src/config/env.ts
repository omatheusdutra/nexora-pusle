import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.string().default("info"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  CORS_ORIGIN: z
    .string()
    .default(
      "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    )
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  WEB_ORIGIN: z.string().url().default("http://localhost:5174"),
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_COOKIE_NAME: z.string().default("nexora_session"),
  AUTH_SESSION_TTL_HOURS: z.coerce.number().positive().default(8),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW: z.string().default("1 minute")
});

type ParsedEnv = z.infer<typeof envSchema>;
export type Env = Omit<ParsedEnv, "AUTH_SECRET"> & { AUTH_SECRET: string };

export function loadEnv(): Env {
  const env = envSchema.parse(process.env);

  if (env.NODE_ENV === "production" && !env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required in production");
  }

  return {
    ...env,
    AUTH_SECRET:
      env.AUTH_SECRET ?? "nexora-pulse-development-secret-change-me"
  };
}
