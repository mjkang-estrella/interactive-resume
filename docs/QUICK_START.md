# Quick Start Guide

A condensed guide to get you up and running quickly.

## 🚀 Installation (2 minutes)

```bash
# 1. Clone
git clone https://github.com/mjkang-estrella/interactive-resume.git
cd interactive-resume

# 2. Install
npm install

# 3. Configure
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY and CHATKIT_WORKFLOW_ID

# 4. Run
npm run dev
```

Visit: http://localhost:3000

## 📝 Common Commands

```bash
# Development
npm run dev              # Backend only (serves built frontend)
npm run dev:frontend     # Vite dev server with HMR (port 5173)
npm run dev:backend      # Backend with auto-reload (port 3000)

# Building
npm run build            # Build everything
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Production
npm start                # Run production server

# Code Quality
npm run lint             # Type check all workspaces
npm run clean            # Clean build artifacts
```

## 🔧 Quick Fixes

### Port Already in Use
```bash
# Change port in .env.local
PORT=3001
```

### Environment Variables Not Loading
```bash
# Make sure .env.local is in the ROOT directory
ls -la .env.local

# Should show: -rw-r--r-- ... .env.local
```

### TypeScript Errors
```bash
npm run lint             # Check errors
npm run build            # Rebuild everything
```

### Frontend Not Updating
```bash
# Kill all processes and restart
npm run clean
npm run build
npm run dev
```

## 📁 File Locations

```
Root
├── frontend/src/        → Frontend source code
│   ├── index.html       → Main HTML
│   ├── ts/              → TypeScript modules
│   └── pages/           → Project templates
├── backend/src/         → Backend source code
├── .env.local           → Your API keys (CREATE THIS)
└── docs/                → Documentation
```

## 🎯 Quick Tasks

### Add a New Project Detail

1. **Create template**: `frontend/src/pages/doc-pages/my-project.html`
2. **Update HTML**: Add button with `data-doc="my-project"` in `index.html`
3. **Rebuild**: `npm run build:frontend`

### Update AI Agent Config

Edit: `frontend/src/ts/agentkit-config.ts`

### Change Styles

Edit: `frontend/src/styles/style.css`

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect to ChatKit | Check OPENAI_API_KEY in .env.local |
| 404 errors | Run `npm run build` first |
| TypeScript errors | Run `npm run lint` to see details |
| Hot reload not working | Use `npm run dev:frontend` for HMR |

## 📚 More Help

- Full documentation: [README.md](../README.md)
- Contributing: [CONTRIBUTING.md](../CONTRIBUTING.md)
- Architecture: [AGENTS.md](./AGENTS.md)

## 🔗 Useful Links

- [OpenAI ChatKit Docs](https://platform.openai.com/docs/chatkit)
- [Vite Guide](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Need more help?** Check the full [README.md](../README.md) or open an issue.
