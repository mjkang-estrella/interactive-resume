# Frontend Workspace

Modern TypeScript frontend with Vite bundling for the Interactive Resume application.

## Overview

This frontend workspace provides:
- **Interactive UI**: Clickable resume with animated detail panels
- **TypeScript**: Fully typed, modular architecture
- **Vite**: Fast development with Hot Module Replacement (HMR)
- **ChatKit Integration**: AI agent widget for user interaction
- **Responsive Design**: Works on desktop and mobile
- **Accessibility**: Motion preference detection and support

## Technology Stack

- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite 5.x
- **Module System**: ES Modules
- **Styling**: Vanilla CSS with custom properties
- **Architecture**: Object-oriented, modular design

## Directory Structure

```
frontend/
├── src/
│   ├── index.html             # Main HTML file
│   ├── ts/                    # TypeScript source
│   │   ├── main.ts            # Application entry point
│   │   ├── agentkit.ts        # ChatKit widget
│   │   ├── agentkit-config.ts # ChatKit configuration
│   │   ├── types/             # Type definitions
│   │   │   ├── index.ts       # Core types
│   │   │   └── agentkit.ts    # ChatKit types
│   │   ├── utils/             # Utility functions
│   │   │   ├── dom.ts         # DOM helpers
│   │   │   └── motion.ts      # Motion preferences
│   │   └── modules/           # Feature modules
│   │       ├── animationController.ts
│   │       ├── docManager.ts
│   │       └── templateLoader.ts
│   ├── styles/
│   │   └── style.css          # Application styles
│   └── pages/
│       └── doc-pages/         # Project detail templates (21 files)
├── dist/                      # Build output (gitignored)
├── package.json               # Frontend dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
└── README.md                  # This file
```

## Development

### From Frontend Directory

```bash
cd frontend

# Install dependencies (if not using workspace)
npm install

# Start Vite dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run lint

# Clean build artifacts
npm run clean
```

### From Project Root (Recommended)

```bash
# Run Vite dev server
npm run dev:frontend

# Build frontend
npm run build:frontend
```

## Architecture

### Main Application Flow

```
Document Ready
    ↓
InteractiveResume Class Init
    ↓
Initialize Modules
    ├─→ MotionPreference (detect animation preferences)
    ├─→ TemplateLoader (manage HTML templates)
    ├─→ AnimationController (handle animations)
    └─→ DocManager (manage content)
    ↓
Set Up Event Listeners
    ├─→ Bullet click handlers
    ├─→ Close button handler
    └─→ Window resize handler
    ↓
Ready for User Interaction
```

### Module Responsibilities

#### `main.ts` - Application Entry Point
- Initializes all modules
- Sets up event listeners
- Coordinates user interactions

#### `animationController.ts` - Animation Engine
- Manages deck show/hide animations
- Handles document content transitions
- Respects motion preferences
- Coordinates paper repositioning

#### `docManager.ts` - Content Manager
- Populates document templates
- Applies data to template slots
- Manages iframe embeds
- Syncs document heights

#### `templateLoader.ts` - Template System
- Loads HTML templates on demand
- Caches templates for performance
- Normalizes template names
- Handles template errors

#### `utils/motion.ts` - Motion Preferences
- Detects user's motion preferences
- Applies appropriate CSS classes
- Updates on preference changes
- Provides animation capability checks

#### `utils/dom.ts` - DOM Helpers
- Simplified querySelector wrappers
- Type-safe element selection
- Reduces boilerplate code

#### `agentkit.ts` - ChatKit Widget
- Initializes OpenAI ChatKit
- Manages widget state
- Handles session persistence
- Provides error handling

### Type System

```typescript
// Core application types
interface DocData {
  section?: string;
  roleTitle?: string;
  bulletText?: string | null;
  url?: string;
  template?: string;
}

type AnimationState = 'open' | 'closed' | 'opening' | 'closing';

// ChatKit types
interface AgentKitConfig {
  integrationType: 'hosted' | 'custom';
  hosted?: AgentKitHostedConfig;
  custom?: AgentKitCustomConfig;
  // ... more configuration
}
```

## Configuration

### Vite Configuration

**Key features** (`vite.config.ts`):
- Root directory: `./src`
- Build output: `../dist`
- Custom plugin: Copies doc-pages to dist
- Path aliases: `@/*` → `./src/*`
- Dev server: Port 5173

### TypeScript Configuration

**Settings** (`tsconfig.json`):
- Target: ES2020
- Module: ESNext (for Vite)
- Strict mode: Enabled
- Path mapping: `@/*` aliases
- No emit (Vite handles compilation)

### ChatKit Configuration

Edit `src/ts/agentkit-config.ts` to customize:

```typescript
export const AGENTKIT_CONFIG: AgentKitConfig = {
  integrationType: 'hosted',
  
  launcher: {
    label: 'Ask the AI Agent',
    hint: 'Resume, projects, roadmap',
  },
  
  startScreen: {
    greeting: 'Hi! I can answer questions...',
    prompts: [
      // ... your prompts
    ],
  },
  
  theme: {
    // ... your theme
  },
};
```

## Adding Content

### Adding a New Project Detail

1. **Create template** (`src/pages/doc-pages/my-project.html`):

```html
<div class="doc-highlight" data-template="my-project">
  <div class="entry doc-entry">
    <h4 data-slot="role">Project Title</h4>
    <p data-slot="bullet">Project description...</p>
    
    <!-- Optional: Add iframe embed -->
    <div data-slot="embed-container" hidden>
      <iframe data-slot="embed-frame"></iframe>
    </div>
  </div>
</div>
```

2. **Update HTML** (`src/index.html`):

```html
<button
  class="bullet"
  data-role="Company — Position"
  data-section="Experience"
  data-doc="my-project"
  data-url="https://optional-embed-url.com"
>
  Click me to see project details
</button>
```

3. **Rebuild**:
```bash
npm run build
```

### Template Slots

Available data slots:
- `[data-slot="section"]` - Section name (e.g., "Experience")
- `[data-slot="section-label"]` - Section label fallback
- `[data-slot="role"]` - Role or title
- `[data-slot="bullet"]` - Main content text
- `[data-slot="embed-container"]` - Optional embed wrapper
- `[data-slot="embed-frame"]` - Optional iframe embed

## Build Process

### Development Build

```bash
npm run dev
```

- Starts Vite dev server on port 5173
- Hot Module Replacement (HMR) enabled
- TypeScript type checking in watch mode
- Source maps for debugging

### Production Build

```bash
npm run build
```

**Build steps:**
1. TypeScript compilation check
2. Vite bundles and optimizes
3. Assets are minified and hashed
4. Doc-pages copied to dist
5. Output to `dist/` directory

**Output:**
```
dist/
├── index.html              # Main HTML (with inlined asset references)
├── assets/
│   ├── main-[hash].css     # Bundled and minified CSS
│   └── main-[hash].js      # Bundled and minified JS
└── pages/
    └── doc-pages/          # Project templates (21 HTML files)
```

**Optimizations:**
- Tree shaking (removes unused code)
- Minification (CSS and JS)
- Asset hashing (for cache busting)
- Code splitting (if configured)

## Styling

### CSS Architecture

```
styles/style.css
├── CSS Custom Properties (theme variables)
├── Reset & Base Styles
├── Layout Styles (page, deck, paper)
├── Component Styles (bullets, doc panels)
├── Animation Classes
└── Media Queries (responsive design)
```

### CSS Custom Properties

```css
:root {
  --page-width: 768px;
  --page-pad-x: 48px;
  --deck-min: 440px;
  /* ... more variables */
}
```

Update these to customize the theme.

## Performance

### Bundle Sizes

Production build (~30 KB gzipped total):
- JavaScript: ~20.63 KB → 6.37 KB gzipped
- CSS: ~7.96 KB → 2.51 KB gzipped
- HTML: ~23.78 KB → 4.44 KB gzipped

### Optimization Techniques

1. **Template Caching**: HTML templates loaded once and cached
2. **Motion Detection**: Skips animations when preferred
3. **Lazy Loading**: Templates load on demand
4. **Asset Optimization**: Vite handles minification
5. **Code Splitting**: ES modules enable tree shaking

## Accessibility

### Features

- **Motion Preferences**: Respects `prefers-reduced-motion`
- **Keyboard Navigation**: Tab navigation supported
- **ARIA Labels**: Proper labeling for screen readers
- **Focus Management**: Focus tracked during interactions
- **Semantic HTML**: Proper heading hierarchy

### Testing Accessibility

```bash
# Enable reduced motion in your OS settings
# Then test the application to verify animations are disabled
```

## Browser Support

### Minimum Requirements

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Required Browser APIs

- ES2020 features (optional chaining, nullish coalescing)
- Web Animations API (for animations)
- ES Modules (native module support)
- CSS Custom Properties
- Fetch API

## Troubleshooting

### Vite Not Starting

```bash
# Check for port conflicts
lsof -i :5173

# Try a different port
vite --port 5174
```

### TypeScript Errors

```bash
# Check all errors
npm run lint

# Clean and rebuild
npm run clean
npm run build
```

### Hot Reload Not Working

1. Check browser console for errors
2. Ensure file is being watched (check Vite output)
3. Try hard refresh (Cmd/Ctrl + Shift + R)
4. Restart Vite dev server

### Templates Not Loading

1. Verify template exists in `src/pages/doc-pages/`
2. Check template name matches `data-doc` attribute
3. Look for fetch errors in browser console
4. Ensure templates are copied to dist after build

## Future Improvements

Planned enhancements:
- [ ] Add PostCSS for CSS preprocessing
- [ ] Implement CSS modules for scoped styles
- [ ] Add PWA support (service worker)
- [ ] Optimize images (WebP conversion)
- [ ] Add lazy loading for images
- [ ] Implement virtual scrolling (if needed)
- [ ] Add analytics integration
- [ ] Enhance SEO (meta tags, structured data)

## Related Documentation

- [Main README](../README.md) - Project overview
- [Backend README](../backend/README.md) - Backend documentation
- [Contributing Guide](../CONTRIBUTING.md) - Development guidelines
- [Quick Start](../docs/QUICK_START.md) - Get started quickly

## Resources

- [Vite Documentation](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)

---

**Part of the Interactive Resume monorepo** | [View Full Documentation](../README.md)
