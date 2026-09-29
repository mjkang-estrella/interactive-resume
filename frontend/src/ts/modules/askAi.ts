/**
 * "Ask an AI" launcher (same design as mj-kang.com). Opens ChatGPT, Claude, or
 * Google AI Mode with a ready-made prompt that points the assistant at this
 * site's /llms.txt, which the build generates from the resume and detail pages.
 */

const SITE = 'https://resume-os.com';

const PROMPT = [
  'Tell me about MJ (Myeongjin) Kang, a product manager and UC Berkeley Haas MBA candidate.',
  `Start with his interactive resume: ${SITE}/llms.txt has his full resume plus the story behind each bullet, and ${SITE}/ is the resume itself.`,
  'Use these public sources when useful: https://mj-kang.com/llms.txt, https://www.linkedin.com/in/mj-kang-product/, and https://blog.mj-kang.com/.',
  'Summarize his experience and his strongest measurable results, then be ready for interview-style follow-up questions about how he achieved them.',
  'Cite the sources you actually read, distinguish facts from interpretation, and say if a source is unavailable. Do not invent missing details.',
].join(' ');

const COPY_LABEL = 'Copy the prompt instead';

export class AskAi {
  private readonly widget: HTMLElement;
  private readonly trigger: HTMLButtonElement;
  private readonly panel: HTMLElement;
  private readonly copyButton: HTMLButtonElement;
  private readonly status: HTMLElement;
  private readonly promptField: HTMLTextAreaElement;
  private readonly links: HTMLAnchorElement[];
  private pinned = false;
  private hoverTimer = 0;
  private copyTimer = 0;

  static mount(): AskAi | null {
    const widget = document.querySelector<HTMLElement>('.ask-ai');
    return widget ? new AskAi(widget) : null;
  }

  private constructor(widget: HTMLElement) {
    this.widget = widget;
    this.trigger = widget.querySelector<HTMLButtonElement>('.ask-ai__trigger')!;
    this.panel = widget.querySelector<HTMLElement>('.ask-ai__panel')!;
    this.copyButton = widget.querySelector<HTMLButtonElement>('.ask-ai__copy')!;
    this.status = widget.querySelector<HTMLElement>('.ask-ai__status')!;
    this.promptField = widget.querySelector<HTMLTextAreaElement>('.ask-ai__prompt')!;
    this.links = Array.from(widget.querySelectorAll<HTMLAnchorElement>('[data-ai-provider]'));

    this.links.forEach((link) => {
      const url = new URL(link.href);
      url.searchParams.set('q', PROMPT);
      if (link.dataset.aiProvider === 'chatgpt') {
        url.searchParams.set('hints', 'search');
      }
      link.href = url.href;
      link.addEventListener('click', () => this.close());
    });
    this.promptField.value = PROMPT;

    this.bindEvents();
    this.widget.hidden = false;
    new BotEyes(widget);
  }

  private open(focus = false): void {
    window.clearTimeout(this.hoverTimer);
    if (this.panel.hidden) {
      this.status.textContent = '';
      this.promptField.hidden = true;
    }
    this.panel.hidden = false;
    this.trigger.setAttribute('aria-expanded', 'true');
    if (focus) this.links[0]?.focus();
  }

  private close(): void {
    window.clearTimeout(this.hoverTimer);
    this.pinned = false;
    this.panel.hidden = true;
    this.trigger.setAttribute('aria-expanded', 'false');
  }

  private bindEvents(): void {
    const canHover = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

    this.trigger.addEventListener('click', () => {
      if (!this.panel.hidden && this.pinned) {
        this.close();
        return;
      }
      this.pinned = true;
      this.open(true);
    });

    this.widget.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch' || !canHover()) return;
      window.clearTimeout(this.hoverTimer);
      this.hoverTimer = window.setTimeout(() => this.open(), 140);
    });
    this.widget.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'touch' || this.pinned || this.widget.contains(document.activeElement)) {
        return;
      }
      window.clearTimeout(this.hoverTimer);
      this.hoverTimer = window.setTimeout(() => this.close(), 380);
    });

    this.widget.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.panel.hidden) {
        event.preventDefault();
        this.close();
        this.trigger.focus();
      }
    });
    document.addEventListener('pointerdown', (event) => {
      if (!this.widget.contains(event.target as Node)) this.close();
    });
    this.widget.addEventListener('focusout', (event) => {
      const next = event.relatedTarget as Node | null;
      if (next && !this.widget.contains(next)) this.close();
    });

    this.copyButton.addEventListener('click', () => void this.copyPrompt());
  }

  private async copyPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(PROMPT);
      this.copyButton.textContent = 'Copied';
      window.clearTimeout(this.copyTimer);
      this.copyTimer = window.setTimeout(() => {
        this.copyButton.textContent = COPY_LABEL;
      }, 1600);
      this.status.textContent = 'Prompt copied. Paste it into your assistant.';
    } catch {
      this.status.textContent = 'Select and copy the prompt below.';
      this.promptField.hidden = false;
      this.promptField.focus();
      this.promptField.select();
    }
  }
}

type Vec3 = [number, number, number];

/** The bot's eyes follow the pointer and blink, drawn as a tiny SVG animation. */
class BotEyes {
  private readonly bot: SVGSVGElement;
  private readonly eyes: SVGRectElement[];
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)');
  private pointer: { x: number; y: number } | null = null;
  private frame = 0;
  private lastFrame = 0;

  constructor(widget: HTMLElement) {
    this.bot = widget.querySelector<SVGSVGElement>('.ask-ai__bot')!;
    this.eyes = Array.from(widget.querySelectorAll<SVGRectElement>('.ask-ai__eye'));

    window.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType !== 'touch' && !this.motion.matches) {
          this.pointer = { x: event.clientX, y: event.clientY };
        }
      },
      { passive: true },
    );
    document.addEventListener('pointerleave', () => {
      this.pointer = null;
    });
    document.addEventListener('visibilitychange', this.sync);
    this.motion.addEventListener('change', this.sync);
    this.sync();
  }

  private sync = (): void => {
    cancelAnimationFrame(this.frame);
    this.draw();
    if (!this.motion.matches && !document.hidden) {
      this.frame = requestAnimationFrame(this.animate);
    }
  };

  private animate = (timestamp: number): void => {
    if (timestamp - this.lastFrame >= 32) {
      this.draw(timestamp / 1000);
      this.lastFrame = timestamp;
    }
    this.frame = requestAnimationFrame(this.animate);
  };

  private draw(seconds = 0): void {
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));
    const rotate = (first: Vec3, second: Vec3, degrees: number): [Vec3, Vec3] => {
      const angle = (degrees * Math.PI) / 180;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [
        first.map((v, i) => v * c + second[i] * s) as Vec3,
        second.map((v, i) => v * c - first[i] * s) as Vec3,
      ];
    };

    const rect = this.bot.getBoundingClientRect();
    const x = this.pointer ? clamp((this.pointer.x - rect.left - rect.width / 2) / (innerWidth / 2)) : 0;
    const y = this.pointer ? clamp((this.pointer.y - rect.top - rect.height / 2) / (innerHeight / 2)) : 0;
    const wander = this.motion.matches || this.pointer ? 0 : Math.sin(seconds / 2) * 4;

    let front: Vec3 = [0, 0, 1];
    let right: Vec3 = [1, 0, 0];
    let up: Vec3 = [0, 1, 0];
    [front, right] = rotate(front, right, -26 + x * 16 + wander);
    [up, front] = rotate(up, front, 10 - y * 13);
    [right, up] = rotate(right, up, -13);

    const blinkTime = seconds % 4.7;
    const lid =
      this.motion.matches || blinkTime < 4.5 ? 1 : Math.max(0.06, Math.abs((blinkTime - 4.6) / 0.1));

    this.eyes.forEach((eye, index) => {
      const [position, horizontal] = rotate(front, right, index === 0 ? -15.46 : 15.46);
      eye.setAttribute(
        'transform',
        `matrix(${horizontal[0]},${horizontal[1] * lid},${up[0]},${up[1] * lid},${position[0] * 100},${position[1] * 100})`,
      );
    });
  }
}
