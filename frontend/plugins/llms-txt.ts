/**
 * Generates /llms.txt: the resume plus the story behind every bullet as plain
 * markdown, so AI assistants (see the "Ask an AI" button) can read the same
 * content visitors see. Built from src/index.html and the doc-page templates,
 * so it never drifts from the site.
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parse, NodeType, type HTMLElement, type Node, type TextNode } from 'node-html-parser';
import type { Plugin } from 'vite';

interface LlmsTxtOptions {
  site: string;
  indexHtml: string;
  docPagesDir: string;
  aboutMarkdown: string;
}

interface BulletRef {
  doc: string;
  role: string;
  text: string;
}

const normalize = (text: string) => text.replace(/‑/g, '-').replace(/\s+/g, ' ');

function wrap(marker: string, text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const lead = text.match(/^\s*/)?.[0] ?? '';
  const trail = text.match(/\s*$/)?.[0] ?? '';
  return `${lead}${marker}${trimmed}${marker}${trail}`;
}

function inline(node: Node): string {
  if (node.nodeType === NodeType.TEXT_NODE) {
    return normalize((node as TextNode).text);
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) {
    return '';
  }
  const el = node as HTMLElement;
  const tag = el.rawTagName?.toLowerCase();
  if (tag === 'img' || tag === 'svg' || tag === 'figure') return '';
  if (tag === 'br') return ' ';
  const inner = el.childNodes.map(inline).join('');
  switch (tag) {
    case 'strong':
    case 'b':
      return wrap('**', inner);
    case 'em':
    case 'i':
      return wrap('*', inner);
    case 'p':
    case 'div':
      return ` ${inner} `;
    case 'a': {
      const href = el.getAttribute('href') ?? '';
      const label = inner.replace(/\s*↗\s*$/, '').trim();
      if (!label) return '';
      return /^https?:/.test(href) ? `[${label}](${href})` : label;
    }
    default:
      return inner;
  }
}

const tidy = (text: string) => text.replace(/\s+/g, ' ').trim();

function list(el: HTMLElement, depth: number): string[] {
  const ordered = el.rawTagName.toLowerCase() === 'ol';
  const lines: string[] = [];
  el.childNodes
    .filter((n): n is HTMLElement => n.nodeType === NodeType.ELEMENT_NODE && (n as HTMLElement).rawTagName.toLowerCase() === 'li')
    .forEach((li, index) => {
      const nested = li.childNodes.filter(
        (n): n is HTMLElement =>
          n.nodeType === NodeType.ELEMENT_NODE && ['ul', 'ol'].includes((n as HTMLElement).rawTagName.toLowerCase()),
      );
      const text = tidy(
        li.childNodes
          .filter((n) => !nested.includes(n as HTMLElement))
          .map(inline)
          .join(''),
      );
      lines.push(`${'  '.repeat(depth)}${ordered ? `${index + 1}.` : '-'} ${text}`);
      nested.forEach((sub) => lines.push(...list(sub, depth + 1)));
    });
  return lines;
}

/** Converts a doc-page subtree to markdown blocks; h2 maps to `h2Level`. */
function blocks(el: HTMLElement, h2Level: number, out: string[]): void {
  // An eyebrow label sitting just above a heading reads better after it.
  let eyebrow: string | null = null;
  for (const node of el.childNodes) {
    if (node.nodeType === NodeType.TEXT_NODE) {
      const text = tidy(inline(node));
      if (text) out.push(text);
      continue;
    }
    if (node.nodeType !== NodeType.ELEMENT_NODE) continue;
    const child = node as HTMLElement;
    const tag = child.rawTagName.toLowerCase();
    const heading = /^h([1-6])$/.exec(tag);
    const next = child.nextElementSibling;
    if (child.classList.contains('doc-case__eyebrow') && next && /^h[1-6]$/i.test(next.rawTagName)) {
      eyebrow = tidy(inline(child));
    } else if (heading) {
      const level = Math.min(6, h2Level + Number(heading[1]) - 2);
      out.push(`${'#'.repeat(level)} ${tidy(inline(child))}`);
      if (eyebrow) {
        out.push(`*${eyebrow}*`);
        eyebrow = null;
      }
    } else if (tag === 'p') {
      const text = tidy(inline(child));
      if (text) out.push(text);
    } else if (tag === 'ul' || tag === 'ol') {
      out.push(list(child, 0).join('\n'));
    } else if (['figure', 'img', 'hr', 'svg'].includes(tag)) {
      continue;
    } else if (['div', 'section', 'aside', 'header', 'main'].includes(tag)) {
      blocks(child, h2Level, out);
    } else {
      const text = tidy(inline(child));
      if (text) out.push(text);
    }
  }
}

function resume(indexHtml: string): { markdown: string[]; bullets: BulletRef[] } {
  const paper = parse(indexHtml).querySelector('#paper');
  if (!paper) throw new Error('[llms-txt] #paper not found in index.html');

  const out: string[] = [];
  const bullets: BulletRef[] = [];
  const bulletList = (ul: HTMLElement) =>
    ul.querySelectorAll('li').map((li) => {
      const button = li.querySelector('button.bullet');
      const text = tidy(inline(li));
      const doc = button?.getAttribute('data-doc');
      if (button && doc) {
        bullets.push({ doc, role: button.getAttribute('data-role') ?? '', text });
      }
      return `- ${text}`;
    });

  for (const child of paper.childNodes) {
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const el = child as HTMLElement;
    if (el.classList.contains('contact-bar')) {
      out.push(tidy(inline(el)));
    } else if (el.classList.contains('section-bar')) {
      const title = tidy(el.text);
      out.push(`### ${title.charAt(0)}${title.slice(1).toLowerCase()}`);
    } else if (el.rawTagName.toLowerCase() === 'section') {
      for (const part of el.childNodes) {
        if (part.nodeType !== NodeType.ELEMENT_NODE) continue;
        const block = part as HTMLElement;
        if (block.classList.contains('entry')) {
          for (const line of block.childNodes) {
            if (line.nodeType !== NodeType.ELEMENT_NODE) continue;
            const item = line as HTMLElement;
            if (item.classList.contains('entry-row')) {
              const company = tidy(inline(item.querySelector('.company') ?? item));
              const dates = tidy(item.querySelector('.meta')?.text ?? '');
              out.push(dates ? `${company} · ${dates}` : company);
            } else if (item.classList.contains('role')) {
              out.push(tidy(inline(item)));
            } else if (item.classList.contains('bullets')) {
              out.push(bulletList(item).join('\n'));
            }
          }
        } else if (block.classList.contains('bullets')) {
          out.push(bulletList(block).join('\n'));
        }
      }
    }
  }
  return { markdown: out, bullets };
}

function story(docPagesDir: string, ref: BulletRef): string[] {
  const html = readFileSync(path.join(docPagesDir, `${ref.doc}.html`), 'utf8');
  const root = parse(html).querySelector(`[data-template="${ref.doc}"]`);
  if (!root) throw new Error(`[llms-txt] ${ref.doc}.html has no data-template root`);

  const title = tidy(root.querySelector('h2')?.text ?? ref.doc);
  root.querySelector('h2')?.remove();
  const heading = ref.role.includes(title) ? ref.role : `${ref.role}: ${title}`;
  const out = [`### ${heading}`, `> Resume bullet: ${ref.text}`];
  blocks(root, 3, out);
  return out;
}

export function buildLlmsTxt(options: LlmsTxtOptions): string {
  const { markdown, bullets } = resume(readFileSync(options.indexHtml, 'utf8'));
  const known = new Set(readdirSync(options.docPagesDir).map((f) => f.replace(/\.html$/, '')));
  const stories: string[] = [];
  const seen = new Set<string>();
  for (const bullet of bullets) {
    if (!known.has(bullet.doc) || seen.has(bullet.doc)) continue;
    seen.add(bullet.doc);
    stories.push(...story(options.docPagesDir, bullet));
  }
  const about = readFileSync(options.aboutMarkdown, 'utf8').trim();

  const sections = [
    '# MJ (Myeongjin) Kang: Interactive Resume',
    `> Product manager and UC Berkeley Haas MBA candidate (May 2027). This file contains his one-page resume and the story behind each resume bullet, generated from ${options.site}/.`,
    [
      `- Resume (web): ${options.site}/`,
      `- Resume (PDF): ${options.site}/contents/resume.pdf`,
      '- Portfolio and side projects: https://mj-kang.com/ (summary: https://mj-kang.com/llms.txt)',
      '- LinkedIn: https://www.linkedin.com/in/mj-kang-product/',
      '- Blog: https://blog.mj-kang.com/',
    ].join('\n'),
    '## Guidance for AI assistants',
    [
      '- The resume section is the source of truth for titles, dates, and metrics. The stories add context behind each bullet.',
      '- Some stories are brief. Do not fill gaps with invented details, and say when something is not covered here.',
      '- Keep professional roles separate from personal projects.',
    ].join('\n'),
    '## Resume',
    ...markdown,
    '## Stories behind the resume bullets',
    ...stories,
    '## Tell me about yourself (in MJ’s words)',
    about,
  ];
  return `${sections.join('\n\n')}\n`;
}

export function llmsTxt(options: LlmsTxtOptions): Plugin {
  return {
    name: 'llms-txt',
    configureServer(server) {
      server.middlewares.use('/llms.txt', (_req, res) => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(buildLlmsTxt(options));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: buildLlmsTxt(options) });
    },
  };
}
