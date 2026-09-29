# Interactive Resume (Resume OS)

MJ Kang's resume as an interactive web page. The left side is a one-page resume that mirrors the PDF; clicking any bullet opens the story behind it on the right. An "Ask an AI" button opens ChatGPT, Claude, or Google AI Mode with a ready-made question about MJ.

**Live:** [resume-os.com](https://resume-os.com/) · **How it was built:** [blog.mj-kang.com/resume-os](https://blog.mj-kang.com/resume-os/)

## Updating the resume

The PDF is the source of truth for resume content. The web-only Resume OS guide in Additional is a navigation aid; it is omitted from print and the resume section of `/llms.txt`. Its explanation is included with the other stories. When the resume changes:

1. **PDF:** replace `frontend/public/contents/resume.pdf` (served by the PDF button).
2. **Paper:** edit the resume markup in `frontend/src/index.html` so the text matches the PDF word for word. Each clickable bullet is a `<button class="bullet" data-doc="…">`.
3. **Detail pages:** each `data-doc="name"` opens `frontend/src/pages/doc-pages/name.html`, whose root element must carry `data-template="name"`. Put images in `frontend/public/media/` and reference them as `media/<file>`. A bullet without `data-doc` is plain text.
4. **Company tooltips:** hover text for each `data-company` lives in `frontend/src/ts/modules/companyTooltip.ts`.
5. **Onboarding:** the first-visit cursor demo clicks the Resume OS guide, marked `data-onboarding`.
6. **Tell me about yourself:** `frontend/content/tell-me-about-yourself.md` is published at the end of `/llms.txt`.

`/llms.txt` is rebuilt from steps 2, 3, and 6 on every build, so there is nothing else to update for AI assistants.

Detail pages use the `doc-case` layout:

```html
<div class="doc-case" data-template="exp-example">
    <h2>Title</h2>
    <p class="doc-case__lead">A short introduction to the work and its outcome.</p>
    <section class="doc-case__section">
        <h3>The decision behind the work</h3>
        <p>…</p>
    </section>
</div>
```

Use sentence-case headings and paragraphs that describe the actual decisions. Keep unknown facts in `<!-- TODO(MJ): … -->` comments, which are excluded from `/llms.txt`. Context typography lives in `doc-pages.css` and is separate from the resume paper.

Wrap screenshots in `doc-case__figure`, add a caption, and include intrinsic `width` and `height` attributes to prevent layout shifts. Link detailed images to their full-size files. Use `doc-case__figure--compact` for small illustrations or badges; charts should keep the full reading width.

## Architecture

A static site built with Vite and TypeScript (no framework, no server):

```
frontend/
  src/index.html            the resume "paper", detail panel, and Ask an AI widget
  src/pages/doc-pages/      one HTML template per bullet, bundled at build time
  src/ts/main.ts            wires bullets → DocManager → AnimationController
  src/ts/modules/askAi.ts   Ask an AI launcher (same design as mj-kang.com)
  plugins/llms-txt.ts       generates /llms.txt from the paper + doc pages
  content/                  extra text published in /llms.txt
  public/                   copied as-is: /contents (PDF, favicon), /media (images, icons)
```

- **Rendering:** the paper is static HTML. On click, `TemplateLoader` swaps the matching doc page (all templates are bundled via `import.meta.glob`) into the panel and `AnimationController` animates it in. Reduced-motion preferences are respected.
- **Layout:** `PaperFit` fits the entire resume within the viewport width and height, with responsive outer margins. On desktop, both sheets keep that scale when a context page opens, with 12px resume and 13px context body text before scaling. Narrow screens stack the context below the resume with a readable 14px body. Two desktop sheets can scroll horizontally if needed.
- **Ask an AI:** the widget links to each assistant with a prompt (in `askAi.ts`) that points it at `https://resume-os.com/llms.txt`, a plain-markdown copy of the resume and every story. No API keys or backend involved.
- **Analytics:** Google Analytics tag in `index.html`.

## Development

Requires Node.js 18+.

```bash
npm install
npm run dev       # http://localhost:5173 (also serves /llms.txt)
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run lint` | Type-check the app, the Vite config, and the llms.txt plugin |
| `npm run build` | Build the static site into `frontend/dist` |
| `npm run preview` | Serve the production build locally |

## Deployment

Deployed on Vercel as a static site (`vercel.json` builds `frontend/dist`). No environment variables are needed.

## License

[ISC](LICENSE)
