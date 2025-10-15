const __import_meta_url = require('node:url').pathToFileURL(__filename).href;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var session_exports = {};
__export(session_exports, {
  createChatKitSessionForUser: () => createChatKitSessionForUser,
  ensureEnvLoaded: () => ensureEnvLoaded,
  getChatKitConfiguration: () => getChatKitConfiguration,
  getChatKitRateLimit: () => getChatKitRateLimit,
  getOpenAIClient: () => getOpenAIClient,
  requireEnv: () => requireEnv
});
module.exports = __toCommonJS(session_exports);
var import_node_path = __toESM(require("node:path"), 1);
var import_node_url = require("node:url");
var import_dotenv = require("dotenv");
var import_openai = require("openai");
const ENV_FILES = [".env", ".env.local"];
let envLoaded = false;
let cachedClient = null;
const MODULE_DIR = import_node_path.default.dirname((0, import_node_url.fileURLToPath)(__import_meta_url));
function collectCandidateRoots(...starts) {
  const roots = [];
  const seen = /* @__PURE__ */ new Set();
  for (const start of starts) {
    let current = import_node_path.default.resolve(start);
    while (!seen.has(current)) {
      roots.push(current);
      seen.add(current);
      const parent = import_node_path.default.dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }
  }
  return roots;
}
function ensureEnvLoaded() {
  if (envLoaded) {
    return;
  }
  envLoaded = true;
  const searchRoots = collectCandidateRoots(MODULE_DIR, process.cwd());
  for (const root of searchRoots) {
    for (const file of ENV_FILES) {
      (0, import_dotenv.config)({ path: import_node_path.default.join(root, file), override: true });
    }
  }
}
function requireEnv(key) {
  ensureEnvLoaded();
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing environment variable ${key}. Set ${key}=... in your environment configuration.`
    );
  }
  return value;
}
function getOpenAIClient() {
  if (cachedClient) {
    return cachedClient;
  }
  const apiKey = requireEnv("OPENAI_API_KEY");
  cachedClient = new import_openai.OpenAI({ apiKey });
  return cachedClient;
}
function getChatKitConfiguration() {
  ensureEnvLoaded();
  if (process.env.CHATKIT_ENABLE_UPLOADS === "false") {
    return void 0;
  }
  return {
    file_upload: {
      enabled: true,
      max_files: Number(process.env.CHATKIT_MAX_FILES ?? 5),
      max_file_size: Number(process.env.CHATKIT_MAX_FILE_SIZE_MB ?? 10)
    }
  };
}
function getChatKitRateLimit() {
  ensureEnvLoaded();
  const maxRequests = Number(process.env.CHATKIT_MAX_REQUESTS_PER_MINUTE ?? 10);
  return {
    max_requests_per_1_minute: maxRequests
  };
}
async function createChatKitSessionForUser(user) {
  const workflowId = requireEnv("CHATKIT_WORKFLOW_ID");
  const openai = getOpenAIClient();
  const chatSession = await openai.beta.chatkit.sessions.create({
    user,
    workflow: {
      id: workflowId
    },
    chatkit_configuration: getChatKitConfiguration(),
    rate_limits: getChatKitRateLimit()
  });
  return {
    client_secret: chatSession.client_secret,
    expires_at: chatSession.expires_at,
    session_id: chatSession.id
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createChatKitSessionForUser,
  ensureEnvLoaded,
  getChatKitConfiguration,
  getChatKitRateLimit,
  getOpenAIClient,
  requireEnv
});
