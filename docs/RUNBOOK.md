# Runbook

Authoritative instructions for setting up, running, and deploying the interactive resume stack.

## 1. Prerequisites

- Node.js ≥ 18 (includes npm)
- OpenAI API key with ChatKit access
- ChatKit workflow ID created in the Agent Builder
- Optional: Vercel account for hosting

## 2. Environment Configuration

1. Copy the template:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the required values.
   - `OPENAI_API_KEY`
   - `CHATKIT_WORKFLOW_ID`
   - `OPENAI_DOMAIN_KEY` (or `VITE_CHATKIT_DOMAIN_KEY`) for deployed environments

> Variables are loaded from the repository root for both the backend and the Vercel API routes. Keep secrets out of the workspace subdirectories.

## 3. Install Dependencies

```bash
npm install
```

This single command pulls dependencies for the root workspace, frontend, and backend packages.

## 4. Development Workflows

### Full stack (recommended)

```bash
npm run dev
# Vite (frontend): http://localhost:5173
# Express API:     http://localhost:3000
```

### Frontend only

```bash
npm run dev:frontend
```

### Backend only

```bash
npm run dev:backend
```

## 5. Build & Test

```bash
# Build everything
npm run build

# Type-check all workspaces
npm run lint

# Clean build artifacts
npm run clean
```

To test the production bundle locally, run:

```bash
cd frontend
npm run preview
```

## 6. Deployment

1. Set environment variables in your hosting provider (Vercel shown below):
   - `OPENAI_API_KEY`
   - `CHATKIT_WORKFLOW_ID`
   - `OPENAI_DOMAIN_KEY` or `VITE_CHATKIT_DOMAIN_KEY`
2. Trigger a deployment (`vercel --prod` or push to `main`).
3. Verify:
   - `/api/chatkit/session` returns HTTP 200.
   - The ChatKit panel stays mounted and can mint a session.

For domain validation and agent configuration, see [`docs/CHATKIT.md`](./CHATKIT.md).

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Port in use | Set `PORT=3001` (backend) or pass `--port` to Vite |
| ChatKit calls 401/404 | Confirm environment variables on the host and domain allow-list |
| Template loader error | Re-run `npm run build:frontend` after adding new `doc-pages` templates |
| TypeScript failing in backend | Run `npm run lint --workspace=backend` for detailed diagnostics |

For a quick refresher on commands, see [`docs/QUICK_START.md`](./QUICK_START.md).
