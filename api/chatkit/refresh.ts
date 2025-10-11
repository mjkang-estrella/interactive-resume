import type { IncomingMessage, ServerResponse } from "node:http";
import {
  createChatKitSessionForUser,
  ensureUserSession,
  handleError,
  readJsonBody,
  sendJson,
} from "./utils";

export const config = {
  runtime: "nodejs20.x",
};

export default async function handler(
  req: IncomingMessage & { method?: string },
  res: ServerResponse,
) {
  if (req.method && req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method Not Allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const currentSecret = body?.current_client_secret;
    if (typeof currentSecret !== "string" || currentSecret.length === 0) {
      sendJson(res, 400, {
        error: "current_client_secret is required to refresh.",
      });
      return;
    }

    const user = ensureUserSession(req, res);
    const session = await createChatKitSessionForUser(user);
    sendJson(res, 200, session);
  } catch (error) {
    handleError(res, error);
  }
}
