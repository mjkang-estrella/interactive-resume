# Quick Start

Use this checklist when you just need the essentials. For the full playbook, see the [Runbook](./RUNBOOK.md).

1. **Clone & install**
   ```bash
   git clone https://github.com/mjkang-estrella/interactive-resume.git
   cd interactive-resume
   npm install
   ```

2. **Configure secrets**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with OPENAI_API_KEY, CHATKIT_WORKFLOW_ID, OPENAI_DOMAIN_KEY
   ```

3. **Run locally**
   ```bash
   npm run dev
   # Frontend: http://localhost:5173
   # API:      http://localhost:3000
   ```

4. **Common commands**
   ```bash
   npm run dev:frontend    # Vite + HMR
   npm run dev:backend     # Express API only
   npm run build           # Build frontend + backend
   npm run lint            # Type-check workspaces
   npm start               # Serve production build
   ```

5. **Troubleshooting**
   - Port busy → set `PORT=` in `.env.local`
   - ChatKit 401/404 → re-check `.env.local` / host env vars
   - Template errors → re-run `npm run build:frontend`
   - Widget blank → verify `OPENAI_DOMAIN_KEY` value

Need more detail? Jump to the [Runbook](./RUNBOOK.md) or the [ChatKit guide](./CHATKIT.md).
