# Contributing to Interactive Resume

Thank you for considering contributing to this project! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)

## 🤝 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Prioritize the project's best interests
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment, trolling, or derogatory comments
- Personal or political attacks
- Publishing others' private information
- Any conduct that could be considered inappropriate

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/interactive-resume.git
cd interactive-resume
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your OpenAI API key to .env.local
```

### 3. Create a Branch

```bash
# Create a feature branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

## 💻 Development Process

### Running the Development Server

```bash
# Frontend with hot reload (recommended for UI work)
npm run dev:frontend

# Backend server
npm run dev:backend

# Both (in separate terminals)
npm run dev:frontend
npm run dev:backend
```

### Making Changes

1. **Frontend Changes** (`frontend/src/`):
   - TypeScript files in `frontend/src/ts/`
   - Styles in `frontend/src/styles/`
   - HTML templates in `frontend/src/pages/doc-pages/`
   - Main HTML in `frontend/src/index.html`

2. **Backend Changes** (`backend/src/`):
   - Server logic in `backend/src/server.ts`
   - Future: Add routes, middleware in subdirectories

3. **Shared Types** (`shared/types/`):
   - Types used by both frontend and backend

### Testing Your Changes

```bash
# Type check
npm run lint

# Build to verify no errors
npm run build

# Test production build
NODE_ENV=production npm run dev:backend
# Visit http://localhost:3000
```

## 📝 Coding Standards

### TypeScript

**Style Guidelines:**

```typescript
// ✅ DO: Use meaningful names
function loadTemplate(templateName: string): Promise<string>

// ❌ DON'T: Use abbreviated or unclear names
function ldTpl(n: string): Promise<string>

// ✅ DO: Use interfaces for objects
interface DocData {
  section?: string;
  roleTitle?: string;
}

// ❌ DON'T: Use 'any' type
function processData(data: any) { }

// ✅ DO: Add JSDoc comments for public APIs
/**
 * Loads and caches an HTML template
 * @param templateName - Name of the template to load
 * @returns The template HTML string
 */
async function loadTemplate(templateName: string): Promise<string>

// ✅ DO: Use const for immutable values
const MAX_RETRY_COUNT = 3;

// ❌ DON'T: Use var
var count = 0;
```

**Formatting:**
- Indentation: 2 spaces
- Quotes: Single quotes for strings
- Semicolons: Required
- Line length: Aim for 100 characters max
- Trailing commas: Yes (for multi-line)

**Type Safety:**
- Enable `strict` mode in tsconfig
- No `any` types (use `unknown` if needed)
- Explicit return types for functions
- Proper null/undefined handling

### File Organization

```typescript
// Order of imports:
// 1. External libraries
import { Express } from 'express';

// 2. Internal modules
import { DocManager } from './modules/docManager';

// 3. Types
import type { DocData } from './types';

// 4. Styles/assets
import './styles/main.css';
```

### Naming Conventions

```typescript
// Classes: PascalCase
class AnimationController { }

// Interfaces/Types: PascalCase
interface UserConfig { }
type AnimationState = 'open' | 'closed';

// Functions/Variables: camelCase
function loadTemplate() { }
const isVisible = true;

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 1024;

// Private members: prefix with underscore (optional)
class Example {
  private _cache = new Map();
}

// Files: kebab-case
// animation-controller.ts
// doc-manager.ts
```

### CSS

```css
/* Use BEM-like naming */
.doc-content { }
.doc-content__header { }
.doc-content--expanded { }

/* Prefer classes over IDs for styling */
.bullet { } /* ✅ */
#bullet { } /* ❌ */

/* Use CSS custom properties for theming */
:root {
  --color-primary: #2563eb;
  --spacing-md: 1rem;
}
```

## 📋 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies

**Examples:**

```bash
feat(frontend): add keyboard navigation for bullet points

fix(backend): correct environment variable path resolution

docs: update README with deployment instructions

refactor(frontend): extract animation logic into separate module

chore(deps): update vite to 5.4.20
```

### Commit Best Practices

- Keep commits focused (one logical change per commit)
- Write clear, descriptive commit messages
- Reference issues when applicable: `fixes #123`
- Don't commit sensitive data (API keys, passwords)
- Don't commit build artifacts or node_modules

## 🔄 Pull Request Process

### Before Submitting

1. **Update your branch:**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run checks:**
   ```bash
   npm run lint
   npm run build
   ```

3. **Test thoroughly:**
   - Test your changes manually
   - Verify existing features still work
   - Test on different screen sizes (if UI changes)

4. **Update documentation:**
   - Update README if adding features
   - Add JSDoc comments for new functions
   - Update CHANGELOG if applicable

### Submitting the PR

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request on GitHub:**
   - Use a clear, descriptive title
   - Reference related issues: `Closes #123`
   - Describe what changed and why
   - Add screenshots for UI changes
   - List any breaking changes

3. **PR Template:**

   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix (non-breaking change fixing an issue)
   - [ ] New feature (non-breaking change adding functionality)
   - [ ] Breaking change (fix or feature causing existing functionality to change)
   - [ ] Documentation update

   ## How to Test
   1. Step-by-step testing instructions
   2. ...

   ## Screenshots (if applicable)
   [Add screenshots here]

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Changes tested locally
   ```

### Review Process

- Maintainers will review your PR
- Address feedback by pushing new commits
- Once approved, your PR will be merged
- Your contribution will be credited

## 🧪 Testing Guidelines

### Manual Testing Checklist

**For Frontend Changes:**
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test on mobile viewport
- [ ] Test with reduced motion enabled
- [ ] Verify console has no errors
- [ ] Check TypeScript compilation passes

**For Backend Changes:**
- [ ] Server starts without errors
- [ ] API endpoints respond correctly
- [ ] Error handling works as expected
- [ ] Environment variables load correctly

**For Documentation Changes:**
- [ ] Links work correctly
- [ ] Code examples are accurate
- [ ] Instructions are clear and complete
- [ ] Markdown renders properly

### Future: Automated Tests

When tests are added, run them before submitting:

```bash
npm test                  # Run all tests
npm run test:frontend     # Frontend tests
npm run test:backend      # Backend tests
npm run test:e2e          # End-to-end tests
```

## 💡 Contribution Ideas

### Good First Issues

- Fix typos in documentation
- Improve error messages
- Add code comments
- Update dependencies
- Write tests (when test infrastructure exists)

### Feature Ideas

- Add new resume sections
- Improve animations
- Enhance mobile experience
- Add accessibility features
- Improve ChatKit integration
- Add analytics
- Implement search functionality

### Code Quality Improvements

- Add ESLint configuration
- Add Prettier for formatting
- Implement automated testing
- Improve error handling
- Add logging system
- Optimize bundle size

## 🆘 Getting Help

- **Questions**: Open a [GitHub Discussion](https://github.com/mjkang-estrella/interactive-resume/discussions)
- **Bugs**: Open an [Issue](https://github.com/mjkang-estrella/interactive-resume/issues)
- **Chat**: (Add Discord/Slack link if available)

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [Git Best Practices](https://www.git-scm.com/book/en/v2)

## �� Thank You!

Every contribution, no matter how small, is valuable and appreciated. Thank you for helping improve this project!

---

**Questions?** Feel free to reach out by opening an issue or discussion.
