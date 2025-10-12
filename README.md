# Interactive Resume

An interactive, animated resume website featuring clickable bullet points that reveal detailed project information. Built with TypeScript, Vite, and Express, featuring OpenAI ChatKit integration for an AI-powered agent interface.

## 🌟 Features

- **Interactive Resume Navigation**: Click any bullet point to see detailed project information with smooth animations
- **AI Agent Integration**: ChatKit-powered AI agent that can answer questions about experience and projects
- **Modern TypeScript Architecture**: Fully typed, modular codebase with clean separation of concerns
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Motion Preferences**: Respects user's reduced motion preferences
- **Template System**: Dynamic content loading for project details
- **Production Ready**: Optimized builds with Vite bundling

## 🚀 Getting Started

- Installation, development, and deployment instructions live in the [Runbook](docs/RUNBOOK.md).
- `.env.example` documents every environment variable. Copy it to `.env.local` and fill in the required keys.
- For a two-minute setup, follow the condensed [Quick Start](docs/QUICK_START.md).
- ChatKit configuration and domain verification are covered in [ChatKit Integration](docs/CHATKIT.md).

## 📁 Project Structure

```
Interactive_Resume/
├── frontend/                      # Frontend workspace
│   ├── src/
│   │   ├── index.html            # Main HTML file
│   │   ├── ts/                   # TypeScript source
│   │   │   ├── main.ts           # Application entry point
│   │   │   ├── agentkit.ts       # ChatKit integration
│   │   │   ├── agentkit-config.ts # ChatKit configuration
│   │   │   ├── types/            # TypeScript type definitions
│   │   │   │   ├── index.ts      # Core types
│   │   │   │   └── agentkit.ts   # ChatKit types
│   │   │   ├── utils/            # Utility functions
│   │   │   │   ├── dom.ts        # DOM helpers
│   │   │   │   └── motion.ts     # Motion preferences
│   │   │   └── modules/          # Feature modules
│   │   │       ├── animationController.ts  # Animation engine
│   │   │       ├── docManager.ts           # Content management
│   │   │       └── templateLoader.ts       # Template loading
│   │   ├── styles/
│   │   │   └── style.css         # Application styles
│   │   └── pages/
│   │       └── doc-pages/        # Project detail templates (21 files)
│   ├── dist/                     # Production build output
│   ├── package.json              # Frontend dependencies & scripts
│   ├── tsconfig.json             # TypeScript configuration
│   └── vite.config.ts            # Vite bundler configuration
│
├── backend/                       # Backend workspace
│   ├── src/
│   │   └── server.ts             # Express server with ChatKit API
│   ├── dist/                     # Compiled backend
│   ├── package.json              # Backend dependencies & scripts
│   └── tsconfig.json             # TypeScript configuration
│
├── shared/                        # Shared modules
│   ├── chatkit/                  # ChatKit session helpers
│   └── types/                    # Shared TypeScript types
│
├── docs/                          # Documentation
│   ├── RUNBOOK.md               # Full setup / deployment guide
│   ├── QUICK_START.md           # Two-minute checklist
│   ├── CHATKIT.md               # ChatKit integration guide
│   └── AGENTS.md                # AI agent overview
│
├── .env.local                     # Environment variables (not in git)
├── .gitignore                     # Git ignore rules
├── package.json                   # Root workspace configuration
└── README.md                      # This file
```

## 🛠️ Development

See the [Runbook](docs/RUNBOOK.md#4-development-workflows) for deeper explanations; the tables below are quick references.

### Available Scripts

#### Root Level (Workspace)

```bash
# Development
npm run dev              # Run frontend (Vite) + backend API together
npm run dev:frontend     # Run Vite dev server with HMR only
npm run dev:backend      # Run backend with auto-reload only

# Building
npm run build            # Build both frontend and backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Production
npm start                # Run production server

# Code Quality
npm run lint             # Type-check all workspaces
npm run clean            # Clean all build artifacts
```

#### Frontend Workspace

```bash
cd frontend

npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # TypeScript type checking
npm run clean            # Remove dist folder
```

#### Backend Workspace

```bash
cd backend

npm run dev              # Start with ts-node-dev
npm run build            # Compile TypeScript
npm run start            # Run compiled code
npm run lint             # TypeScript type checking
npm run clean            # Remove dist folder
```

### Development Workflow

1. **Full-Stack Development** (recommended):
   ```bash
   npm run dev
   ```
   - Runs Vite on port 5173 and API on port 3000
   - `/api/chatkit/*` requests are proxied to the backend automatically

2. **Frontend Development** (with hot reload only):
   ```bash
   npm run dev:frontend
   ```
   - Vite provides instant hot module replacement
   - Changes reflect immediately in browser
   - TypeScript errors shown in terminal

3. **Backend Development**:
   ```bash
   npm run dev:backend
   ```
   - ts-node-dev auto-restarts on changes
   - Serves frontend from `frontend/src/` in development
   - Serves frontend from `frontend/dist/` in production

4. **Manual full-stack (two terminals)**:
   - Terminal 1: `npm run dev:backend`
   - Terminal 2: `npm run dev:frontend`
   - Useful if you need to restart one side independently

### Adding New Content

#### Adding a New Resume Section

1. **Update HTML** (`frontend/src/index.html`):
   ```html
   <button
       class="bullet"
       data-role="Company Name — Role"
       data-section="Experience"
       data-doc="template-name"
   >
       Your bullet point text
   </button>
   ```

2. **Create Template** (`frontend/src/pages/doc-pages/template-name.html`):
   ```html
   <div class="doc-highlight" data-template="template-name">
       <div class="entry doc-entry">
           <h4 data-slot="role">Role Title</h4>
           <p data-slot="bullet">Detailed description...</p>
       </div>
   </div>
   ```

3. **Rebuild**:
   ```bash
   npm run build:frontend
   ```

#### Customizing ChatKit Agent

Update `frontend/src/ts/agentkit-config.ts`:

```typescript
export const AGENTKIT_CONFIG: AgentKitConfig = {
  launcher: {
    label: 'Your Label',
    hint: 'Your hint text',
  },
  startScreen: {
    greeting: 'Your greeting message',
    prompts: [
      {
        icon: 'sparkle',
        label: 'Prompt Label',
        prompt: 'Actual prompt sent to AI',
      },
    ],
  },
  // ... more configuration
};
```

## 🏗️ Architecture

### Frontend Architecture

The frontend follows a modular, object-oriented architecture:

```
┌─────────────────────────────────────────┐
│           main.ts (Entry Point)         │
│         InteractiveResume Class         │
└────────────┬────────────────────────────┘
             │
             ├──> MotionPreference
             │    (Detects animation preferences)
             │
             ├──> TemplateLoader
             │    (Loads & caches HTML templates)
             │
             ├──> AnimationController
             │    (Manages deck/doc animations)
             │
             └──> DocManager
                  (Manages document content)
```

**Key Design Patterns:**
- **Dependency Injection**: Modules receive dependencies via constructor
- **Single Responsibility**: Each module has one clear purpose
- **Separation of Concerns**: Animation, content, and templates are separate
- **Type Safety**: Full TypeScript coverage with interfaces

### Backend Architecture

Simple Express server with:
- Static file serving (frontend assets)
- ChatKit session management API endpoints
- CORS configuration
- Cookie-based session handling
- Environment-based configuration

### Data Flow

```
User Click
    ↓
Event Handler (main.ts)
    ↓
AnimationController.showDeck()
    ↓
DocManager.populateDoc()
    ↓
TemplateLoader.loadTemplate()
    ↓
DocManager.applyDocData()
    ↓
AnimationController.animateDocSwap()
    ↓
Display Content
```

## 🔧 Configuration

### TypeScript Configuration

Both frontend and backend use strict TypeScript:

**Frontend** (`frontend/tsconfig.json`):
- Target: ES2020
- Module: ESNext (for Vite)
- Bundler module resolution
- Path aliases: `@/*` → `./src/*`

**Backend** (`backend/tsconfig.json`):
- Target: ES2022
- Module: CommonJS (for Node.js)
- Node module resolution
- Output: `./dist`

### Vite Configuration

**Key Features** (`frontend/vite.config.ts`):
- Root: `./src`
- Build output: `../dist`
- Custom plugin: Copies doc-pages to dist
- Path aliases for clean imports
- Dev server on port 5173

## 🚢 Deployment

### Deploying to Production

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set environment variables** on your hosting platform:
   ```
   NODE_ENV=production
   OPENAI_API_KEY=your_key
   CHATKIT_WORKFLOW_ID=your_workflow_id
   PORT=3000
   ```

3. **Deploy files**:
   - Upload entire project or use Git
   - Ensure `node_modules` are installed on server
   - Run `npm install --production` on server

4. **Start the server**:
   ```bash
   npm start
   ```

### Hosting Options

**Recommended Platforms:**

#### Vercel (Frontend Only - Easiest)

This project includes a `vercel.json` configuration for easy deployment of the static frontend:

1. **Connect your GitHub repository** to Vercel
2. **Vercel will automatically detect** the configuration
3. **Set environment variables** (if using ChatKit features, deploy backend separately)
4. **Deploy!**

The frontend will be deployed as a static site. For ChatKit functionality, you'll need to:
- Deploy the backend separately (see Backend Deployment below)
- Update the ChatKit API URLs in the frontend configuration

#### Other Options

- **Railway**: Easy deployment with GitHub integration (supports full-stack)
- **Render**: Free tier available, auto-deploys from Git (supports full-stack)
- **Heroku**: Classic PaaS with easy setup
- **DigitalOcean App Platform**: Managed platform with reasonable pricing
- **AWS / GCP / Azure**: For more control and scalability

### Backend Deployment (For ChatKit Features)

If you need the ChatKit AI agent functionality, deploy the backend separately:

**Option 1: Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and init
railway login
railway init

# Set environment variables
railway variables set OPENAI_API_KEY=your_key
railway variables set CHATKIT_WORKFLOW_ID=your_workflow_id

# Deploy backend
railway up
```

**Option 2: Render**
1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `npm run build:backend`
4. Set start command: `npm start`
5. Add environment variables in Render dashboard

**Option 3: Heroku**
```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set OPENAI_API_KEY=your_key
heroku config:set CHATKIT_WORKFLOW_ID=your_workflow_id

# Deploy
git push heroku main
```

After deploying the backend, update the frontend configuration (`frontend/src/ts/agentkit-config.ts`) with your backend URL.

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t interactive-resume .
docker run -p 3000:3000 --env-file .env.local interactive-resume
```

## 🧪 Testing

### Manual Testing Checklist

**Frontend:**
- [ ] Resume displays correctly
- [ ] Bullet points are clickable
- [ ] Detail panel opens with animation
- [ ] Templates load correctly
- [ ] Close button works
- [ ] Navigation is smooth
- [ ] Responsive on mobile
- [ ] Reduced motion preference respected

**Backend:**
- [ ] Server starts without errors
- [ ] Static files served correctly
- [ ] ChatKit session endpoint works
- [ ] Environment variables loaded
- [ ] Error handling works

**ChatKit:**
- [ ] Launcher button appears
- [ ] Widget opens on click
- [ ] AI responds to messages
- [ ] Thread persists on refresh
- [ ] File uploads work (if enabled)

### Future Testing (Recommended)

Add testing frameworks:
- **Frontend**: Vitest + Testing Library
- **Backend**: Jest + Supertest
- **E2E**: Playwright or Cypress

## 🐛 Troubleshooting

### Common Issues

#### "Missing environment variable OPENAI_API_KEY"

**Solution**: Create `.env.local` in the root directory with your API key:
```env
OPENAI_API_KEY=sk-...
CHATKIT_WORKFLOW_ID=...
```

#### Frontend not loading / 404 errors

**Solution**: 
1. Build the frontend: `npm run build:frontend`
2. Check `frontend/dist/` exists
3. Ensure `NODE_ENV=production` when running backend in production mode

#### TypeScript errors

**Solution**:
```bash
# Check for errors
npm run lint

# Rebuild
npm run build
```

#### Port already in use

**Solution**: Change the port in `.env.local`:
```env
PORT=3001
```

#### ChatKit not loading

**Solution**:
1. Verify API key and workflow ID are correct
2. Check browser console for errors
3. Ensure ChatKit CDN script loads: `https://cdn.platform.openai.com/deployments/chatkit/chatkit.js`

#### Doc-pages not showing

**Solution**:
1. Verify templates exist in `frontend/src/pages/doc-pages/`
2. Rebuild frontend: `npm run build:frontend`
3. Check `frontend/dist/pages/doc-pages/` contains files

#### Animation issues

**Solution**:
1. Check browser console for JavaScript errors
2. Verify browser supports Web Animations API
3. Test with reduced motion disabled in OS settings

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing patterns and structure
- Add types for all functions and variables
- Keep functions small and focused
- Comment complex logic
- Update documentation as needed

## 📝 License

ISC License - see [LICENSE](LICENSE) file for details

## 👤 Author

**MJ Kang**
- LinkedIn: [linkedin.com/in/mj-kang-product](https://linkedin.com/in/mj-kang-product)
- Email: mj.kang@mba.berkeley.edu

## 🙏 Acknowledgments

- [OpenAI ChatKit](https://platform.openai.com/docs/chatkit) - AI agent integration
- [Vite](https://vitejs.dev/) - Fast build tool
- [Express](https://expressjs.com/) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## 📚 Additional Resources

- [OpenAI ChatKit Documentation](https://platform.openai.com/docs/chatkit)
- [Vite Documentation](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express Documentation](https://expressjs.com/en/guide/routing.html)

---

**Need Help?** Open an issue on [GitHub](https://github.com/mjkang-estrella/interactive-resume/issues)
