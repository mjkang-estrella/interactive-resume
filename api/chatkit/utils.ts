import crypto from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import { ensureEnvLoaded } from "@interactive-resume/shared";
import type { ControllerResult } from "@interactive-resume/shared";

type Json = Record<string, unknown>;

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getCookieName(): string {
  ensureEnvLoaded();
  return process.env.CHATKIT_SESSION_COOKIE ?? "chatkit_session_id";
}

function isSecureCookie(): boolean {
  ensureEnvLoaded();
  if (process.env.CHATKIT_FORCE_SECURE_COOKIE === "true") {
    return true;
  }
  // Vercel sets both NODE_ENV and VERCEL_ENV in production builds.
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) {
    return {};
  }

  const tokens = header
    .split(";")
    .map((part: string) => part.trim())
    .filter((part: string) => part.length > 0)
    .map((cookie: string) => {
      const [name, ...valueParts] = cookie.split("=");
      return [name, valueParts.join("=")] as const;
    });

  return tokens.reduce<Record<string, string>>((acc, [name, value]) => {
    try {
      acc[name] = decodeURIComponent(value);
    } catch {
      acc[name] = value;
    }
    return acc;
  }, {});
}

function appendSetCookie(res: ServerResponse, cookie: string): void {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookie);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookie]);
    return;
  }

  res.setHeader("Set-Cookie", [existing as string, cookie]);
}

function serializeCookie(name: string, value: string): string {
  const secure = isSecureCookie();
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
  ];

  if (secure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function ensureUserSession(
  req: IncomingMessage,
  res: ServerResponse,
): string {
  const cookieName = getCookieName();
  const cookies = parseCookies(req);
  const existing = cookies[cookieName];
  if (existing) {
    return existing;
  }

  const sessionId = `user_${crypto.randomUUID()}`;
  appendSetCookie(res, serializeCookie(cookieName, sessionId));
  return sessionId;
}

export async function readJsonBody(req: IncomingMessage): Promise<Json> {
  const asAny = req as IncomingMessage & { body?: Json | string };
  if (typeof asAny.body === "object" && asAny.body !== null) {
    return asAny.body as Json;
  }
  if (typeof asAny.body === "string") {
    try {
      return JSON.parse(asAny.body);
    } catch {
      return {};
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(
      typeof chunk === "string" ? Buffer.from(chunk, "utf8") : Buffer.from(chunk),
    );
  }
  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function sendJson(res: ServerResponse, status: number, payload: Json) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export function applyControllerResult(
  res: ServerResponse,
  result: ControllerResult<Json>,
) {
  const headers = result.headers;
  if (headers) {
    for (const name of Object.keys(headers)) {
      const value = headers[name];
      if (value !== undefined) {
        res.setHeader(name, value);
      }
    }
  }
  sendJson(res, result.status, result.body);
}

export function handleError(res: ServerResponse, error: unknown): void {
  console.error("[ChatKit API error]", error);
  if (error instanceof Error) {
    sendJson(res, 500, { error: error.message });
    return;
  }
  sendJson(res, 500, { error: "Unexpected server error" });
}
