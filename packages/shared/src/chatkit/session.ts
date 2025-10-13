import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { OpenAI } from "openai";

const ENV_FILES = [".env", ".env.local"] as const;
let envLoaded = false;
let cachedClient: OpenAI | null = null;
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

function collectCandidateRoots(...starts: string[]): string[] {
  const roots: string[] = [];
  const seen = new Set<string>();

  for (const start of starts) {
    let current = path.resolve(start);
    while (!seen.has(current)) {
      roots.push(current);
      seen.add(current);
      const parent = path.dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }
  }

  return roots;
}

export function ensureEnvLoaded(): void {
  if (envLoaded) {
    return;
  }
  envLoaded = true;

  const searchRoots = collectCandidateRoots(MODULE_DIR, process.cwd());

  for (const root of searchRoots) {
    for (const file of ENV_FILES) {
      loadEnv({ path: path.join(root, file), override: true });
    }
  }
}

export function requireEnv(key: string): string {
  ensureEnvLoaded();
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing environment variable ${key}. Set ${key}=... in your environment configuration.`,
    );
  }
  return value;
}

export function getOpenAIClient(): OpenAI {
  if (cachedClient) {
    return cachedClient;
  }
  const apiKey = requireEnv("OPENAI_API_KEY");
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

export function getChatKitConfiguration() {
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

export function getChatKitRateLimit() {
  ensureEnvLoaded();
  const maxRequests = Number(process.env.CHATKIT_MAX_REQUESTS_PER_MINUTE ?? 10);
  return {
    max_requests_per_1_minute: maxRequests,
  };
}

export async function createChatKitSessionForUser(user: string) {
  const workflowId = requireEnv("CHATKIT_WORKFLOW_ID");
  const openai = getOpenAIClient();
  const chatSession = await openai.beta.chatkit.sessions.create({
    user,
    workflow: {
      id: workflowId,
    },
    chatkit_configuration: getChatKitConfiguration(),
    rate_limits: getChatKitRateLimit(),
  });

  return {
    client_secret: chatSession.client_secret,
    expires_at: chatSession.expires_at,
    session_id: chatSession.id,
  };
}
