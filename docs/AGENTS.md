# Repository Guidelines

## Project Structure & Module Organization
The root contains `index.html`, which drives the full layout, semantic sections, and the interactive bullet buttons. Styling lives in `style.css`, which defines CSS custom properties and reusable utility classes. When adding images or downloadable assets, create an `assets/` directory at the top level and reference files with relative paths so the static hosting setup remains portable.

## Build, Test, and Development Commands
The site is static, so no build step is needed. Use a lightweight local server to review changes with live reload from your editor:
```sh
python3 -m http.server 8000
```
Then open `http://localhost:8000/index.html` to validate layout, hover states, and button interactions. If you prefer Node tooling, `npx serve .` works similarly.

## Coding Style & Naming Conventions
Match the existing four-space indentation in both HTML and CSS. Keep markup semantic by reusing established classes (`.page`, `.section-bar`, `.entry`) and extend them with descriptive, kebab-case modifiers when necessary (for example, `.section-bar--highlight`). Font stacks and color tokens are centralized in the `:root` block—add new theme values there before using them inside rules. Run a formatter such as `npx prettier --write index.html style.css` before opening a pull request.

## Testing Guidelines
There is no automated test suite. Manually check updates in current Chrome, Safari, and Firefox, and confirm the layout holds at common breakpoints (≥1024px desktop and ≈768px tablet). Trigger each `.bullet` button to ensure dataset attributes remain in sync with the rendered text. Document any visual changes with before/after screenshots when proposing UI adjustments.

## Commit & Pull Request Guidelines
Write commits in the imperative mood (e.g., `Add timeline badges`) and keep subject lines under 72 characters with concise bodies describing rationale. Pull requests should include: a short summary of the change, instructions for manual verification (commands run, browsers tested), and any relevant links or issue IDs. Request review before merging, and wait for at least one approval if collaborating with multiple agents.
