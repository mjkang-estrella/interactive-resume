# AI Agent Overview

This document summarizes how the interactive resume integrates OpenAI ChatKit. For configuration details, see [`docs/CHATKIT.md`](./CHATKIT.md).

## Architecture

- **Frontend widget** (`frontend/src/ts/agentkit.ts`) renders the ChatKit panel and handles session refresh.
- **Backend Express server** (`backend/src/server.ts`) serves the production build and proxies `/api/chatkit/*`.
- **Serverless routes** (`api/chatkit/session.ts`, `api/chatkit/refresh.ts`) provide the same endpoints on Vercel.
- **Shared helpers** (`shared/chatkit/session.ts`) centralize environment loading and session creation.

## Data Flow

1. Browser loads `openai-chatkit` web component from the CDN.
2. Widget requests `/api/chatkit/session`.
3. Backend uses the OpenAI SDK to create a ChatKit session and returns a client secret.
4. Widget establishes a conversation with the OpenAI API using that client secret.

## Local Development Checklist

- Run `npm run dev` so both Vite (5173) and Express (3000) are available.
- Keep `.env.local` at the repository root with `OPENAI_API_KEY` and `CHATKIT_WORKFLOW_ID`.
- Inspect the browser console for `[AgentKit]` messages during debugging.

## Production Checklist

- Allow-list the deployment domains in the OpenAI dashboard.
- Provide the generated `OPENAI_DOMAIN_KEY` (or `VITE_CHATKIT_DOMAIN_KEY`) in your host environment.
- Verify `/api/chatkit/session` returns HTTP 200 after deployment.
- Monitor function logs (`vercel logs --source function`) for runtime errors.

## Helpful References

- [ChatKit Integration Guide](./CHATKIT.md)
- [Runbook](./RUNBOOK.md)
- [Quick Start](./QUICK_START.md)
