import crypto from "node:crypto";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { config as loadEnv } from "dotenv";
import { OpenAI } from "openai";

type Json = Record<string, unknown>;

const ENV_FILES = [".env", ".env.local"] as const;
let envLoaded = false;

function ensureEnvLoaded(): void {
  if (envLoaded) {
    return;
  }
  envLoaded = true;

  const root = process.cwd();
  for (const file of ENV_FILES) {
    loadEnv({ path: path.join(root, file), override: true });
  }
}

function requireEnv(key: string): string {
  ensureEnvLoaded();

  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing environment variable ${key}. Set ${key}=... in your Vercel project or .env.local.`,
    );
  }
  return value;
}

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

  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((cookie) => {
      const [name, ...value] = cookie.split("=");
      return [name, value.join("=")] as const;
    })
    .reduce<Record<string, string>>((acc, [name, value]) => {
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

function openAiClient(): OpenAI {
  ensureEnvLoaded();
  const apiKey = requireEnv("OPENAI_API_KEY");
  return new OpenAI({ apiKey });
}

const openai = openAiClient();

function mapChatKitConfiguration(): Json | undefined {
  ensureEnvLoaded();
  if (process.env.CHATKIT_ENABLE_UPLOADS === "false") {
    return undefined;
  }

  return {
    file_upload: {
      enabled: true,
      max_files: Number(process.env.CHATKIT_MAX_FILES ?? 5),
      max_file_size: Number(process.env.CHATKIT_MAX_FILE_SIZE_MB ?? 10),
    },
  };
}

export async function createChatKitSessionForUser(user: string) {
  const workflowId = requireEnv("CHATKIT_WORKFLOW_ID");
  const chatSession = await openai.beta.chatkit.sessions.create({
    user,
    workflow: {
      id: workflowId,
    },
    chatkit_configuration: mapChatKitConfiguration(),
    rate_limits: {
      max_requests_per_1_minute: Number(
        process.env.CHATKIT_MAX_REQUESTS_PER_MINUTE ?? 10,
      ),
    },
  });

  return {
    client_secret: chatSession.client_secret,
    expires_at: chatSession.expires_at,
    session_id: chatSession.id,
  };
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

export function handleError(res: ServerResponse, error: unknown): void {
  console.error("[ChatKit API error]", error);
  if (error instanceof Error) {
    sendJson(res, 500, { error: error.message });
    return;
  }
  sendJson(res, 500, { error: "Unexpected server error" });
}
