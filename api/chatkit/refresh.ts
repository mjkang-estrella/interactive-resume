import type { IncomingMessage, ServerResponse } from "http";
import {
  ensureUserSession,
  handleError,
  readJsonBody,
  applyControllerResult,
} from "./utils";
import { createSessionController } from "@interactive-resume/shared";

export const config = {
  runtime: "nodejs",
};

const sessionController = createSessionController();

export default async function handler(
  req: IncomingMessage & { method?: string },
  res: ServerResponse,
) {
  try {
    const body = await readJsonBody(req);
    const currentSecret = body?.current_client_secret;
    const user = ensureUserSession(req, res);
    const result = await sessionController.refresh({
      method: req.method,
      user,
      currentClientSecret: currentSecret,
    });
    applyControllerResult(res, result);
  } catch (error) {
    handleError(res, error);
  }
}
