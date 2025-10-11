# ChatKit Backend (Local Development)

This lightweight Express server issues ChatKit client secrets so the floating agent on `index.html` can connect to your OpenAI workflow during development.

## Prerequisites

1. Node.js 18 or newer.
2. An OpenAI API key with access to AgentKit (`OPENAI_API_KEY`).
3. The workflow/agent identifier created in Agent Builder (`CHATKIT_WORKFLOW_ID`).

Create a `.env.local` file in the project root with at least:

```
OPENAI_API_KEY=sk-proj-...
CHATKIT_WORKFLOW_ID=wf_...
```

Optional environment variables:

| Name | Description | Default |
| --- | --- | --- |
| `CHATKIT_PORT` | Port for the server | `3000` |
| `CHATKIT_SESSION_COOKIE` | Cookie name storing the user session | `chatkit_session_id` |
| `CHATKIT_MAX_FILES` | Max uploads per session | `5` |
| `CHATKIT_MAX_FILE_SIZE_MB` | Max upload size (MB) | `10` |
| `CHATKIT_MAX_REQUESTS_PER_MINUTE` | Rate limit per minute | `10` |
| `CHATKIT_CORS_ORIGIN` | Allowed CORS origin; `true` allows all | `true` |

## Install & Run

```sh
npm install
npm run dev
```

The server serves the static resume and exposes:

- `POST /api/chatkit/session` &mdash; create a new ChatKit session.
- `POST /api/chatkit/refresh` &mdash; mint a fresh client secret (the old value must be supplied in the request body).

Open http://localhost:3000/index.html and press “Ask the AI Agent” to verify the widget connects successfully.
