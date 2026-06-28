export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    options: { statusCode?: number; code?: string; details?: unknown } = {}
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = options.statusCode ?? 400;
    this.code = options.code ?? "APP_ERROR";
    this.details = options.details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    const labels: Record<string, string> = {
      Attendance: "Atendimento",
      Attendant: "Atendente",
      Team: "Time",
      User: "Usuário",
      Usuário: "Usuário"
    };

    super(`${labels[resource] ?? resource} não encontrado`, {
      statusCode: 404,
      code: "NOT_FOUND"
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, {
      statusCode: 409,
      code: "CONFLICT"
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Autenticação obrigatória") {
    super(message, {
      statusCode: 401,
      code: "UNAUTHENTICATED"
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Permissão insuficiente") {
    super(message, {
      statusCode: 403,
      code: "FORBIDDEN"
    });
  }
}
