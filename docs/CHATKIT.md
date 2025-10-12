# ChatKit Integration Guide

Reference for configuring the OpenAI ChatKit agent used by the interactive resume.

## 1. Components

- **Backend Express server** (`backend/src/server.ts`)
- **Vercel serverless routes** (`api/chatkit/session.ts`, `api/chatkit/refresh.ts`)
- **Frontend widget** (`frontend/src/ts/agentkit.ts`)

All three call into `shared/chatkit/session.ts`, which encapsulates environment loading, rate limits, and session creation.

## 2. Required Environment Variables

| Variable | Purpose | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | Authenticates with OpenAI | Keep secret; load at the project root |
| `CHATKIT_WORKFLOW_ID` | Identifies the workflow to run | From the Agent Builder |
| `OPENAI_DOMAIN_KEY` / `VITE_CHATKIT_DOMAIN_KEY` | Proves hosted-domain ownership | Generated in the OpenAI console |

Optional knobs (also read from the root `.env.local`):

- `CHATKIT_SESSION_COOKIE`
- `CHATKIT_MAX_FILES`
- `CHATKIT_MAX_FILE_SIZE_MB`
- `CHATKIT_MAX_REQUESTS_PER_MINUTE`
- `CHATKIT_ENABLE_UPLOADS`
- `CHATKIT_CORS_ORIGIN`

See `.env.example` for defaults.

## 3. Domain Verification

1. Visit the OpenAI dashboard → *Settings → Organization → Security*.
2. Add your deployment domains (e.g., `interactive-resume.vercel.app`, custom domains).
3. Generate the domain key. Store it as `OPENAI_DOMAIN_KEY` or `VITE_CHATKIT_DOMAIN_KEY`.
4. Redeploy: the frontend injects the key into `window.OPENAI_DOMAIN_KEY`, allowing the widget to stay mounted.

## 4. Hosted vs Custom Modes

The project uses the **hosted** ChatKit integration by default (`integrationType: 'hosted'` in `agentkit-config.ts`).

- Hosted mode expects the backend to mint short-lived client secrets via `/api/chatkit/session`.
- To switch to custom mode, provide `custom.url`, `custom.domainKey`, and optional upload/auth strategies in `agentkit-config.ts`.

## 5. Local Development Checklist

- `npm run dev` (or `npm run dev:backend`) to start the Express server.
- Ensure `.env.local` contains the required keys.
- Use the browser console to watch for `[AgentKit]` log entries.

## 6. Production Deployment Checklist

1. Configure environment variables in Vercel (or your host).
2. Redeploy; Vercel’s build installs dev dependencies (`vercel.json`) so TypeScript emits the serverless handlers.
3. Post-deploy, call `/api/chatkit/session` in the browser developer tools to confirm a 200 response.
4. Monitor `vercel logs <project> --source function` for runtime errors.

## 7. Common Errors

| Error | Likely Cause | Fix |
| --- | --- | --- |
| 401 `domain_keys/verify_hosted` | Domain not allow-listed or domain key missing | Add domain in OpenAI console, redeploy with `OPENAI_DOMAIN_KEY` |
| 500 `/api/chatkit/session` | Missing env vars | Double-check host environment |
| Widget goes blank after load | `window.OPENAI_DOMAIN_KEY` undefined | Ensure deployment pipeline sets the env variable |

For full project commands and deployment steps, see [`docs/RUNBOOK.md`](./RUNBOOK.md).
