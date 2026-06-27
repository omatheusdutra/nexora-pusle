import type { FastifyError, FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../domain/errors";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    const requestId = request.id;

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "Validation error",
        code: "VALIDATION_ERROR",
        requestId,
        details: error.flatten()
      });
    }

    if ("validation" in error && error.validation) {
      return reply.status(400).send({
        error: "Validation error",
        code: "VALIDATION_ERROR",
        requestId,
        details: error.validation
      });
    }

    if ("statusCode" in error && error.statusCode === 400) {
      return reply.status(400).send({
        error: "Validation error",
        code: "VALIDATION_ERROR",
        requestId,
        details: error.message
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.message,
        code: error.code,
        requestId,
        details: error.details
      });
    }

    request.log.error({ error }, "Unhandled request error");

    return reply.status(500).send({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message,
      code: "INTERNAL_SERVER_ERROR",
      requestId
    });
  });
}
