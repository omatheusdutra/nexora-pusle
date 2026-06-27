import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";
import { createInMemoryContainer } from "../src/infrastructure/repositories/in-memory-workflow";

describe("API", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({
      container: createInMemoryContainer(),
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

  it("creates and routes an attendance", async () => {
    const response = await request(app.server)
      .post("/api/v1/attendances")
      .send({
        customerName: "Maria Silva",
        subject: "Problemas com cartao"
      })
      .expect(201);

    expect(response.body.attendance.team.type).toBe("CARDS");
    expect(response.body.attendance.status).toBe("IN_PROGRESS");
  });

  it("finishes an attendance", async () => {
    const created = await request(app.server)
      .post("/api/v1/attendances")
      .send({
        customerName: "Joao Lima",
        subject: "Contratacao de emprestimo"
      })
      .expect(201);

    const response = await request(app.server)
      .patch(`/api/v1/attendances/${created.body.attendance.id}/finish`)
      .expect(200);

    expect(response.body.result).toBe("FINISHED");
    expect(response.body.attendance.status).toBe("FINISHED");
  });

  it("returns dashboard summary", async () => {
    await request(app.server).post("/api/v1/attendances").send({
      customerName: "Cliente Dashboard",
      subject: "Outros"
    });

    const response = await request(app.server)
      .get("/api/v1/dashboard/summary")
      .expect(200);

    expect(response.body.totalAttendances).toBe(1);
    expect(response.body.inProgress).toBe(1);
  });

  it("validates invalid payload", async () => {
    const response = await request(app.server)
      .post("/api/v1/attendances")
      .send({
        customerName: "",
        subject: ""
      })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("handles malformed JSON as validation error", async () => {
    const response = await request(app.server)
      .post("/api/v1/attendances")
      .set("Content-Type", "application/json")
      .send('{"customerName":')
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
