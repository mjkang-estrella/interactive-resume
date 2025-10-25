import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import {
  ensureEnvLoaded,
  requireEnv,
  createSessionController,
} from "@interactive-resume/shared";
import type { ControllerResult } from "@interactive-resume/shared";

// Load .env files from project root
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_PATH = path.resolve(MODULE_DIR, "../..");
ensureEnvLoaded();

const REQUIRED_ENV = [
  "OPENAI_API_KEY",
  "CHATKIT_WORKFLOW_ID",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
for (const key of REQUIRED_ENV) {
  requireEnv(key);
}

const PORT = Number(process.env.PORT || process.env.CHATKIT_PORT || 3000);
const COOKIE_NAME = process.env.CHATKIT_SESSION_COOKIE ?? "chatkit_session_id";
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days
const app = express();
const sessionController = createSessionController();

const supabaseUrl = requireEnv("SUPABASE_URL");
const supabaseKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const waitlistEndpoint = new URL("/rest/v1/waitlist_signups", supabaseUrl).toString();
app.use(
  cors({
    origin: process.env.CHATKIT_CORS_ORIGIN ?? true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Serve built frontend in production, src in development
// Use ROOT_PATH to ensure we're relative to project root, not backend dir
const FRONTEND_DIR =
  process.env.NODE_ENV === "production"
    ? path.join(ROOT_PATH, "frontend", "dist")
    : path.join(ROOT_PATH, "frontend", "src");
app.use(express.static(FRONTEND_DIR));

interface SessionRequest extends Request {
  cookies: Record<string, string | undefined>;
}

function ensureUserSession(req: SessionRequest, res: Response): string {
  let sessionId = req.cookies[COOKIE_NAME];
  if (!sessionId) {
    sessionId = `user_${crypto.randomUUID()}`;
    res.cookie(COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return sessionId;
}

function applyControllerResult(
  res: Response,
  result: ControllerResult<Record<string, unknown>>,
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
  res.status(result.status).json(result.body);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 320) {
    return null;
  }
  return EMAIL_REGEX.test(normalized) ? normalized : null;
}

app.post("/api/waitlist", async (req: Request, res: Response) => {
  const email = parseEmail((req.body as Record<string, unknown> | undefined)?.email);

  if (!email) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }

  try {
    const response = await fetch(waitlistEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify([{ email }]),
    });

    if (response.status === 409) {
      res.status(409).json({ error: "This email is already on the waitlist." });
      return;
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(async () => {
        const text = await response.text().catch(() => "");
        return text ? { message: text } : null;
      })) as Record<string, unknown> | null;
      const errorMessage =
        (typeof errorBody?.message === "string" && errorBody.message) ||
        (typeof errorBody?.error === "string" && errorBody.error) ||
        "Unable to save your email right now. Please try again.";

      console.error("[Waitlist] Failed to insert email", {
        status: response.status,
        error: errorBody,
      });

      const status = response.status >= 400 && response.status < 600 ? response.status : 500;
      res.status(status).json({ error: errorMessage });
      return;
    }

    res.status(201).json({ message: "Thanks for your interest! We'll reach out soon." });
  } catch (error) {
    console.error("[Waitlist] Unexpected error", error);
    res.status(500).json({ error: "Unexpected error while saving your email." });
  }
});

app.post(
  "/api/chatkit/session",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    try {
      const user = ensureUserSession(req, res);
      const result = await sessionController.create({
        method: req.method,
        user,
      });
      applyControllerResult(res, result);
    } catch (error) {
      next(error);
    }
  },
);

app.post(
  "/api/chatkit/refresh",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    try {
      const user = ensureUserSession(req, res);
      const result = await sessionController.refresh({
        method: req.method,
        user,
        currentClientSecret: req.body?.current_client_secret,
      });
      applyControllerResult(res, result);
    } catch (error) {
      next(error);
    }
  },
);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[ChatKit backend error]", error);

  if (error instanceof Error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: "Unexpected server error" });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`ChatKit dev server ready at http://localhost:${PORT}`);
});
