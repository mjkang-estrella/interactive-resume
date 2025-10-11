import type { IncomingMessage, ServerResponse } from "node:http";
import {
  createChatKitSessionForUser,
  ensureUserSession,
  handleError,
  sendJson,
} from "./utils";

export const config = {
  runtime: "nodejs",
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
    const user = ensureUserSession(req, res);
    const session = await createChatKitSessionForUser(user);
    sendJson(res, 200, session);
  } catch (error) {
    handleError(res, error);
  }
}
