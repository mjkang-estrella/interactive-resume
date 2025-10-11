# Backend Workspace

Express.js server that provides ChatKit session management and serves the frontend application.

## Overview

This backend workspace handles:
- **ChatKit Integration**: Issues client secrets for OpenAI ChatKit sessions
- **Static File Serving**: Serves the built frontend application
- **Session Management**: Cookie-based user session handling
- **API Endpoints**: RESTful APIs for ChatKit operations

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Environment**: dotenv for configuration

## Directory Structure

```
backend/
├── src/
│   └── server.ts          # Main Express server
├── dist/                  # Compiled JavaScript (gitignored)
├── package.json           # Backend dependencies & scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Prerequisites

1. **Node.js**: v18.x or higher
2. **OpenAI API Key**: With AgentKit access
3. **ChatKit Workflow ID**: From Agent Builder

## Environment Variables

The backend loads environment variables from the **project root** (not the backend directory).

Required variables in `../../.env.local`:

```env
OPENAI_API_KEY=sk-proj-your-key-here
CHATKIT_WORKFLOW_ID=wf_your-workflow-id
```

Optional variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `CHATKIT_SESSION_COOKIE` | Cookie name | `chatkit_session_id` |
| `CHATKIT_MAX_FILES` | Max file uploads | `5` |
| `CHATKIT_MAX_FILE_SIZE_MB` | Max file size (MB) | `10` |
| `CHATKIT_MAX_REQUESTS_PER_MINUTE` | Rate limit | `10` |
| `CHATKIT_CORS_ORIGIN` | CORS origin | `true` (all) |
| `CHATKIT_ENABLE_UPLOADS` | Enable uploads | `true` |

## Development

### From Backend Directory

```bash
cd backend

# Install dependencies (if not using workspace)
npm install

# Start development server
npm run dev

# Type check
npm run lint

# Build
npm run build

# Run built code
npm start
```

### From Project Root (Recommended)

```bash
# Run backend
npm run dev:backend

# Build backend
npm run build:backend

# Type check backend
npm run lint --workspace=backend
```

## API Endpoints

### POST /api/chatkit/session

Creates a new ChatKit session with a client secret.

**Request Body:**
```json
{
  "agent_id": "optional-agent-id"
}
```

**Response:**
```json
{
  "client_secret": "cs_...",
  "expires_at": "2025-01-11T12:00:00Z",
  "session_id": "sess_..."
}
```

### POST /api/chatkit/refresh

Refreshes an existing ChatKit session.

**Request Body:**
```json
{
  "current_client_secret": "cs_..."
}
```

**Response:**
```json
{
  "client_secret": "cs_...",
  "expires_at": "2025-01-11T12:00:00Z",
  "session_id": "sess_..."
}
```

### GET * (Catch-all)

Serves static frontend files:
- **Development**: Serves from `frontend/src/`
- **Production**: Serves from `frontend/dist/`

Determined by `NODE_ENV` environment variable.

## Architecture

```
Client Request
    ↓
Express Middleware Stack
    ├─→ CORS
    ├─→ JSON Parser
    ├─→ Cookie Parser
    └─→ Static Files
    ↓
API Routes
    ├─→ POST /api/chatkit/session
    └─→ POST /api/chatkit/refresh
    ↓
Error Handler
    ↓
Response
```

## Configuration

### TypeScript (`tsconfig.json`)

- Target: ES2022
- Module: CommonJS (for Node.js)
- Source: `./src`
- Output: `./dist`
- Strict mode: Enabled

### Build Output

TypeScript compiles to `dist/` directory:

```
dist/
└── server.js           # Compiled server
```

## Production Deployment

1. **Build the backend:**
   ```bash
   npm run build
   ```

2. **Set environment variables** on your hosting platform

3. **Start the server:**
   ```bash
   NODE_ENV=production npm start
   ```

The server will serve the frontend from `frontend/dist/` in production mode.

## Troubleshooting

### Port Already in Use

Change the port in `.env.local`:
```env
PORT=3001
```

### Environment Variables Not Loading

Ensure `.env.local` is in the **project root**, not the backend directory:
```bash
# Should be here:
/path/to/Interactive_Resume/.env.local

# NOT here:
/path/to/Interactive_Resume/backend/.env.local
```

### TypeScript Errors

```bash
npm run lint           # Check for errors
npm run build          # Compile TypeScript
```

### Frontend Not Served

```bash
# Build frontend first
npm run build:frontend

# Then start backend in production mode
NODE_ENV=production npm run dev
```

## Future Improvements

Planned enhancements:
- [ ] Split routes into separate modules
- [ ] Add middleware directory
- [ ] Implement request validation (zod/joi)
- [ ] Add structured logging (winston/pino)
- [ ] Add security headers (helmet)
- [ ] Implement rate limiting
- [ ] Add health check endpoint
- [ ] Add metrics/monitoring

## Related Documentation

- [Main README](../README.md) - Project overview
- [Contributing Guide](../CONTRIBUTING.md) - Development guidelines
- [Quick Start](../docs/QUICK_START.md) - Get started quickly
- [Frontend README](../frontend/README.md) - Frontend documentation

---

**Part of the Interactive Resume monorepo** | [View Full Documentation](../README.md)
