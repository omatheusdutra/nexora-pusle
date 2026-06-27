export const idParamSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string" }
  }
} as const;

export const createAttendanceJsonSchema = {
  type: "object",
  required: ["customerName", "subject"],
  properties: {
    customerName: { type: "string", minLength: 2, maxLength: 120 },
    subject: { type: "string", minLength: 2, maxLength: 140 }
  }
} as const;

export const createAttendantJsonSchema = {
  type: "object",
  required: ["name", "teamId"],
  properties: {
    name: { type: "string", minLength: 2, maxLength: 120 },
    teamId: { type: "string" },
    isOnline: { type: "boolean", default: true },
    maxConcurrentAttendances: {
      type: "integer",
      minimum: 1,
      maximum: 10,
      default: 3
    }
  }
} as const;

export const updateAttendantStatusJsonSchema = {
  type: "object",
  required: ["isOnline"],
  properties: {
    isOnline: { type: "boolean" }
  }
} as const;

export const attendanceQueryJsonSchema = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: ["QUEUED", "IN_PROGRESS", "FINISHED", "CANCELLED"]
    },
    teamId: { type: "string" },
    attendantId: { type: "string" },
    subject: { type: "string" },
    page: { type: "integer", minimum: 1, default: 1 },
    pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 }
  }
} as const;
