import path from "node:path";
import crypto from "node:crypto";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config as loadEnv } from "dotenv";
import { OpenAI } from "openai";

// Load .env files from project root
const ROOT_PATH = path.resolve(__dirname, "../..");
const ENV_FILES = [".env", ".env.local"];
for (const file of ENV_FILES) {
  loadEnv({ path: path.join(ROOT_PATH, file), override: true });
}

const REQUIRED_ENV = ["OPENAI_API_KEY", "CHATKIT_WORKFLOW_ID"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(
      `Missing environment variable ${key}. ` +
        `Create a .env.local file with ${key}=... to run the ChatKit backend.`,
    );
  }
}

const PORT = Number(process.env.PORT || process.env.CHATKIT_PORT || 3000);
const COOKIE_NAME = process.env.CHATKIT_SESSION_COOKIE ?? "chatkit_session_id";
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days
const ALLOW_ATTACHMENTS = process.env.CHATKIT_ENABLE_UPLOADS !== "false";

const app = express();
app.use(
  cors({
    origin: process.env.CHATKIT_CORS_ORIGIN ?? true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

function mapChatKitConfiguration() {
  if (!ALLOW_ATTACHMENTS) {
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

app.post(
  "/api/chatkit/session",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    try {
      const user = ensureUserSession(req, res);
      const workflowId = process.env.CHATKIT_WORKFLOW_ID as string;

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

      res.json({
        client_secret: chatSession.client_secret,
        expires_at: chatSession.expires_at,
        session_id: chatSession.id,
      });
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
      const workflowId = process.env.CHATKIT_WORKFLOW_ID as string;

      const chatSession = await openai.beta.chatkit.sessions.create({
        user,
        workflow: {
          id: workflowId,
        },
        chatkit_configuration: mapChatKitConfiguration(),
      });

      res.json({
        client_secret: chatSession.client_secret,
        expires_at: chatSession.expires_at,
        session_id: chatSession.id,
      });
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
