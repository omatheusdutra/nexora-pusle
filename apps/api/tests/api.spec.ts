import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";
import { createInMemoryContainer } from "../src/infrastructure/repositories/in-memory-workflow";
import type { AppContainer } from "../src/application/contracts";

function setCookies(response: request.Response) {
  const value = response.headers["set-cookie"];

  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

describe("API", () => {
  let app: FastifyInstance;
  let container: AppContainer;

  beforeEach(async () => {
    container = createInMemoryContainer();
    app = await buildApp({
      container,
      logger: false,
      rateLimitMax: 1_000
    });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("redirects API root to Swagger docs", async () => {
    const response = await request(app.server).get("/").expect(302);

    expect(response.headers.location).toBe("/docs");
  });

  async function login(
    email = "admin@nexora.local",
    password = "Admin@12345"
  ) {
    const response = await request(app.server)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    return setCookies(response);
  }

  it("logs in with valid credentials and sets an HttpOnly cookie", async () => {
    const response = await request(app.server)
      .post("/api/v1/auth/login")
      .send({
        email: "admin@nexora.local",
        password: "Admin@12345"
      })
      .expect(200);

    expect(response.body.user).toMatchObject({
      name: "Lucas Almeida",
      email: "admin@nexora.local",
      role: "ADMIN"
    });
    const cookie = setCookies(response)[0];

    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("returns a generic error for invalid login", async () => {
    const response = await request(app.server)
      .post("/api/v1/auth/login")
      .send({
        email: "admin@nexora.local",
        password: "wrong-password"
      })
      .expect(401);

    expect(response.body.code).toBe("UNAUTHENTICATED");
    expect(response.body.error).toBe("Credenciais inválidas");
  });

  it("rejects /auth/me without a session cookie", async () => {
    const response = await request(app.server)
      .get("/api/v1/auth/me")
      .expect(401);

    expect(response.body.code).toBe("UNAUTHENTICATED");
  });

  it("returns the authenticated user from /auth/me", async () => {
    const cookie = await login();
    const response = await request(app.server)
      .get("/api/v1/auth/me")
      .set("Cookie", cookie)
      .expect(200);

    expect(response.body.user).toMatchObject({
      email: "admin@nexora.local",
      role: "ADMIN"
    });
  });

  it("clears the session cookie on logout", async () => {
    const cookie = await login();
    const response = await request(app.server)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookie)
      .expect(200);

    expect(setCookies(response)[0]).toContain("Max-Age=0");
  });

  it("protects dashboard APIs without authentication", async () => {
    const response = await request(app.server)
      .get("/api/v1/dashboard/summary")
      .expect(401);

    expect(response.body.code).toBe("UNAUTHENTICATED");
  });

  it("forbids supervisor users from admin-only routes", async () => {
    const cookie = await login("supervisor@nexora.local", "Supervisor@12345");
    const response = await request(app.server)
      .post("/api/v1/users")
      .set("Cookie", cookie)
      .send({
        name: "Operador Demo",
        email: "operador@nexora.local",
        password: "Operador@12345",
        role: "SUPERVISOR"
      })
      .expect(403);

    expect(response.body.code).toBe("FORBIDDEN");
  });

  it("stores demo user passwords as hashes", async () => {
    const user = await container.userRepository.findByEmail(
      "admin@nexora.local"
    );

    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe("Admin@12345");
    expect(user?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("creates and routes an attendance", async () => {
    const cookie = await login();
    const response = await request(app.server)
      .post("/api/v1/attendances")
      .set("Cookie", cookie)
      .send({
        customerName: "Maria Silva",
        subject: "Problemas com cartao"
      })
      .expect(201);

    expect(response.body.attendance.team.type).toBe("CARDS");
    expect(response.body.attendance.status).toBe("IN_PROGRESS");
  });

  it("finishes an attendance", async () => {
    const cookie = await login();
    const created = await request(app.server)
      .post("/api/v1/attendances")
      .set("Cookie", cookie)
      .send({
        customerName: "Joao Lima",
        subject: "Contratacao de emprestimo"
      })
      .expect(201);

    const response = await request(app.server)
      .patch(`/api/v1/attendances/${created.body.attendance.id}/finish`)
      .set("Cookie", cookie)
      .expect(200);

    expect(response.body.result).toBe("FINISHED");
    expect(response.body.attendance.status).toBe("FINISHED");
  });

  it("returns dashboard summary", async () => {
    const cookie = await login();
    await request(app.server)
      .post("/api/v1/attendances")
      .set("Cookie", cookie)
      .send({
        customerName: "Cliente Dashboard",
        subject: "Outros"
      });

    const response = await request(app.server)
      .get("/api/v1/dashboard/summary")
      .set("Cookie", cookie)
      .expect(200);

    expect(response.body.totalAttendances).toBe(1);
    expect(response.body.inProgress).toBe(1);
  });

  it("lists audit events for operational actions", async () => {
    const cookie = await login();
    const created = await request(app.server)
      .post("/api/v1/attendances")
      .set("Cookie", cookie)
      .send({
        customerName: "Cliente Auditoria",
        subject: "Problemas com cartao"
      })
      .expect(201);

    const response = await request(app.server)
      .get("/api/v1/audit-events")
      .set("Cookie", cookie)
      .query({ type: "ATTENDANCE_CREATED" })
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.data[0].entityId).toBe(created.body.attendance.id);
  });

  it("exposes JSON and Prometheus metrics", async () => {
    const cookie = await login();
    await request(app.server)
      .post("/api/v1/attendances")
      .set("Cookie", cookie)
      .send({
        customerName: "Cliente Metricas",
        subject: "Outros"
      });

    const json = await request(app.server)
      .get("/api/v1/metrics")
      .set("Cookie", cookie)
      .expect(200);
    expect(json.body.totalAttendances).toBe(1);
    expect(json.body.generatedAt).toBeDefined();

    const prometheus = await request(app.server).get("/metrics").expect(200);
    expect(prometheus.text).toContain("nexora_attendances_total 1");
    expect(prometheus.headers["content-type"]).toContain("text/plain");
  });

  it("validates invalid payload", async () => {
    const cookie = await login();
    const response = await request(app.server)
      .post("/api/v1/attendances")
      .set("Cookie", cookie)
      .send({
        customerName: "",
        subject: ""
      })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("handles malformed JSON as validation error", async () => {
    const cookie = await login();
    const response = await request(app.server)
      .post("/api/v1/attendances")
      .set("Cookie", cookie)
      .set("Content-Type", "application/json")
      .send('{"customerName":')
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
