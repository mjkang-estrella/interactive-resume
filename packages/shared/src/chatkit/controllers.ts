import { createChatKitSessionForUser } from "./session.js";

type ChatKitSession = Awaited<
  ReturnType<typeof createChatKitSessionForUser>
>;

export interface ControllerResult<Body extends Record<string, unknown>> {
  status: number;
  body: Body;
  headers?: Record<string, string>;
}

export interface CreateSessionContext {
  method?: string;
  user: string;
}

export interface RefreshSessionContext extends CreateSessionContext {
  currentClientSecret?: unknown;
}

interface ControllerDependencies {
  createSession: typeof createChatKitSessionForUser;
}

const ALLOW_HEADER_VALUE = "POST";

function methodNotAllowed(): ControllerResult<{ error: string }> {
  return {
    status: 405,
    body: { error: "Method Not Allowed" },
    headers: { Allow: ALLOW_HEADER_VALUE },
  };
}

function missingSecret(): ControllerResult<{ error: string }> {
  return {
    status: 400,
    body: { error: "current_client_secret is required to refresh." },
  };
}

const guardMethod = (method?: string) =>
  method && method !== "POST" ? methodNotAllowed() : undefined;

export function createSessionController(
  deps: ControllerDependencies = { createSession: createChatKitSessionForUser },
) {
  const { createSession } = deps;

  return {
    async create(
      context: CreateSessionContext,
    ): Promise<ControllerResult<ChatKitSession | { error: string }>> {
      const invalid = guardMethod(context.method);
      if (invalid) {
        return invalid;
      }

      const session = await createSession(context.user);
      return {
        status: 200,
        body: session,
      };
    },

    async refresh(
      context: RefreshSessionContext,
    ): Promise<ControllerResult<ChatKitSession | { error: string }>> {
      const invalid = guardMethod(context.method);
      if (invalid) {
        return invalid;
      }

      if (
        typeof context.currentClientSecret !== "string" ||
        context.currentClientSecret.length === 0
      ) {
        return missingSecret();
      }

      const session = await createSession(context.user);
      return {
        status: 200,
        body: session,
      };
    },
  };
}
