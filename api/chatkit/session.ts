import type { IncomingMessage, ServerResponse } from "http";
import {
  ensureUserSession,
  handleError,
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
    const user = ensureUserSession(req, res);
    const result = await sessionController.create({
      method: req.method,
      user,
    });
    applyControllerResult(res, result);
  } catch (error) {
    handleError(res, error);
  }
}
