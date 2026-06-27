import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthUserDto, UserRole } from "@flowpay/shared";

export interface AuthSessionConfig {
  secret: string;
  cookieName: string;
  ttlHours: number;
  secure: boolean;
  sameSite: "lax" | "strict";
}

interface SessionPayload extends AuthUserDto {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

const header = {
  alg: "HS256",
  typ: "JWT"
};

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function secureCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(
  user: AuthUserDto,
  config: Pick<AuthSessionConfig, "secret" | "ttlHours">
) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...user,
    sub: user.id,
    iat: now,
    exp: now + config.ttlHours * 60 * 60
  };
  const body = `${encodeJson(header)}.${encodeJson(payload)}`;

  return `${body}.${sign(body, config.secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  config: Pick<AuthSessionConfig, "secret">
): AuthUserDto | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  const body = `${encodedHeader}.${encodedPayload}`;

  if (!secureCompare(sign(body, config.secret), signature)) {
    return null;
  }

  try {
    const decodedHeader = decodeJson<typeof header>(encodedHeader);
    const payload = decodeJson<SessionPayload>(encodedPayload);
    const now = Math.floor(Date.now() / 1000);

    if (decodedHeader.alg !== "HS256" || decodedHeader.typ !== "JWT") {
      return null;
    }

    if (payload.exp <= now || payload.sub !== payload.id) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");

    if (!rawName || rawValue.length === 0) {
      continue;
    }

    try {
      cookies.set(rawName, decodeURIComponent(rawValue.join("=")));
    } catch {
      cookies.set(rawName, rawValue.join("="));
    }
  }

  return cookies;
}

export function getSessionTokenFromCookie(
  cookieHeader: string | undefined,
  config: Pick<AuthSessionConfig, "cookieName">
) {
  return parseCookies(cookieHeader).get(config.cookieName);
}

export function verifySessionCookie(
  cookieHeader: string | undefined,
  config: Pick<AuthSessionConfig, "cookieName" | "secret">
) {
  return verifySessionToken(getSessionTokenFromCookie(cookieHeader, config), config);
}

export function serializeSessionCookie(token: string, config: AuthSessionConfig) {
  const maxAge = Math.round(config.ttlHours * 60 * 60);
  return [
    `${config.cookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${config.sameSite === "strict" ? "Strict" : "Lax"}`,
    `Max-Age=${maxAge}`,
    config.secure ? "Secure" : null
  ]
    .filter(Boolean)
    .join("; ");
}

export function serializeClearSessionCookie(config: AuthSessionConfig) {
  return [
    `${config.cookieName}=`,
    "Path=/",
    "HttpOnly",
    `SameSite=${config.sameSite === "strict" ? "Strict" : "Lax"}`,
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    config.secure ? "Secure" : null
  ]
    .filter(Boolean)
    .join("; ");
}
