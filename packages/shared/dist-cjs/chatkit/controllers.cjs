const __import_meta_url = require('node:url').pathToFileURL(__filename).href;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var controllers_exports = {};
__export(controllers_exports, {
  createSessionController: () => createSessionController
});
module.exports = __toCommonJS(controllers_exports);
var import_session = require("./session.cjs");
const ALLOW_HEADER_VALUE = "POST";
function methodNotAllowed() {
  return {
    status: 405,
    body: { error: "Method Not Allowed" },
    headers: { Allow: ALLOW_HEADER_VALUE }
  };
}
function missingSecret() {
  return {
    status: 400,
    body: { error: "current_client_secret is required to refresh." }
  };
}
const guardMethod = (method) => method && method !== "POST" ? methodNotAllowed() : void 0;
function createSessionController(deps = { createSession: import_session.createChatKitSessionForUser }) {
  const { createSession } = deps;
  return {
    async create(context) {
      const invalid = guardMethod(context.method);
      if (invalid) {
        return invalid;
      }
      const session = await createSession(context.user);
      return {
        status: 200,
        body: session
      };
    },
    async refresh(context) {
      const invalid = guardMethod(context.method);
      if (invalid) {
        return invalid;
      }
      if (typeof context.currentClientSecret !== "string" || context.currentClientSecret.length === 0) {
        return missingSecret();
      }
      const session = await createSession(context.user);
      return {
        status: 200,
        body: session
      };
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSessionController
});
