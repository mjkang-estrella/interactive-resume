import path from "node:path";
import crypto from "node:crypto";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import {
  ensureEnvLoaded,
  requireEnv,
  createChatKitSessionForUser,
} from "../../shared/chatkit/session";

// Load .env files from project root
const ROOT_PATH = path.resolve(__dirname, "../..");
ensureEnvLoaded();

const REQUIRED_ENV = ["OPENAI_API_KEY", "CHATKIT_WORKFLOW_ID"] as const;
for (const key of REQUIRED_ENV) {
  requireEnv(key);
}

const PORT = Number(process.env.PORT || process.env.CHATKIT_PORT || 3000);
const COOKIE_NAME = process.env.CHATKIT_SESSION_COOKIE ?? "chatkit_session_id";
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days
const app = express();
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
const FRONTEND_DIR = process.env.NODE_ENV === 'production'
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

app.post(
  "/api/chatkit/session",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    try {
      const user = ensureUserSession(req, res);
      const session = await createChatKitSessionForUser(user);
      res.json(session);
    } catch (error) {
      next(error);
    }
  },
);

app.post(
  "/api/chatkit/refresh",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    try {
      const currentClientSecret = req.body?.current_client_secret;
      if (
        typeof currentClientSecret !== "string" ||
        currentClientSecret.length === 0
      ) {
        res
          .status(400)
          .json({ error: "current_client_secret is required to refresh." });
        return;
      }

      const user = ensureUserSession(req, res);
      const session = await createChatKitSessionForUser(user);
      res.json(session);
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
