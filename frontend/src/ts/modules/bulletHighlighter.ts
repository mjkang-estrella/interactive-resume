const SVG_NS = 'http://www.w3.org/2000/svg';
const HIGHLIGHT_FILTER_ID = 'bulletHighlightEdge';
const HIGHLIGHT_LAYER_CLASS = 'highlight-ink-layer';
const HIGHLIGHT_INK_WRAP_CLASS = 'highlight-ink-wrap';
const HIGHLIGHT_INK_CLASS = 'highlight-ink';
const BULLET_LABEL_CLASS = 'bullet-label';
const HIGHLIGHT_FADING_CLASS = 'highlight-ink-wrap--fading';

type EasingFn = (t: number) => number;

const Easings: Record<'linear' | 'easeInQuint' | 'easeOutQuint', EasingFn> = {
  linear: (t) => t,
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 - Math.pow(1 - t, 5),
};

const reduceMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface AnimationOptions {
  duration: number;
  easing: EasingFn;
  update: (progress: number) => void;
  shouldStop?: () => boolean;
}

function animate({ duration, easing, update, shouldStop }: AnimationOptions): Promise<void> {
  if (duration <= 0 || reduceMotion) {
    update(1);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const start = performance.now();

    function frame(now: number) {
      if (shouldStop?.()) {
        update(1);
        resolve();
        return;
      }

      const elapsed = now - start;
      const progress = duration === 0 ? 1 : Math.min(1, elapsed / duration);
      update(easing(progress));
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

let filterReady = false;

function ensureHighlightFilter(): void {
  if (filterReady || typeof document === 'undefined') return;
  if (document.getElementById(HIGHLIGHT_FILTER_ID)) {
    filterReady = true;
    return;
  }

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');
  Object.assign(svg.style, {
    position: 'absolute',
    left: '-9999px',
    top: '-9999px',
  });

  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', HIGHLIGHT_FILTER_ID);
  filter.setAttribute('x', '-5%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '110%');
  filter.setAttribute('height', '200%');
  filter.setAttribute('color-interpolation-filters', 'sRGB');

  const turbulence = document.createElementNS(SVG_NS, 'feTurbulence');
  turbulence.setAttribute('type', 'fractalNoise');
  turbulence.setAttribute('baseFrequency', '0.9');
  turbulence.setAttribute('numOctaves', '2');
  turbulence.setAttribute('stitchTiles', 'stitch');
  turbulence.setAttribute('seed', '7');
  turbulence.setAttribute('result', 'noise');

  const displacement = document.createElementNS(SVG_NS, 'feDisplacementMap');
  displacement.setAttribute('in', 'SourceGraphic');
  displacement.setAttribute('in2', 'noise');
  displacement.setAttribute('scale', '6.6');
  displacement.setAttribute('xChannelSelector', 'R');
  displacement.setAttribute('yChannelSelector', 'G');

  filter.appendChild(turbulence);
  filter.appendChild(displacement);
  svg.appendChild(filter);
  document.body.appendChild(svg);
  filterReady = true;
}

function ensureHighlightHost(bullet: HTMLButtonElement): {
  host: HTMLElement;
  layer: HTMLElement;
} | null {
  let label = bullet.querySelector<HTMLElement>(`.${BULLET_LABEL_CLASS}`);

  if (!label) {
    label = document.createElement('span');
    label.className = BULLET_LABEL_CLASS;

    while (bullet.firstChild) {
      label.appendChild(bullet.firstChild);
    }

    bullet.appendChild(label);
  }

  label.classList.add('highlight-host');

  let layer = label.querySelector<HTMLElement>(`.${HIGHLIGHT_LAYER_CLASS}`);
  if (!layer) {
    layer = document.createElement('span');
    layer.className = HIGHLIGHT_LAYER_CLASS;
    label.appendChild(layer);
  }

  return { host: label, layer };
}

export class BulletHighlighter {
  private activeInks: HTMLElement[] = [];
  private animationQueue: Promise<void> = Promise.resolve();
  private abortRequested = false;

  private constructor(private host: HTMLElement, private layer: HTMLElement) {}

  public static create(bullet: HTMLButtonElement): BulletHighlighter | null {
    const parts = ensureHighlightHost(bullet);
    if (!parts) return null;
    ensureHighlightFilter();
    return new BulletHighlighter(parts.host, parts.layer);
  }

  public highlight(): Promise<void> {
    this.abortRequested = false;
    this.animationQueue = this.animationQueue.then(() => this.runHighlight());
    return this.animationQueue;
  }

  public fadeOut(): Promise<void> {
    this.abortRequested = true;
    this.animationQueue = this.animationQueue.then(() => this.runFadeOut());
    return this.animationQueue;
  }

  private async runHighlight(): Promise<void> {
    if (!this.host.isConnected) {
      this.clearInks();
      return;
    }

    this.removeResidualInks();

    const rects = this.measureTextRects();
    if (!rects.length) {
      this.clearInks();
      return;
    }

    const hostRect = this.host.getBoundingClientRect();
    const totalWidth = rects.reduce((sum, rect) => sum + rect.width, 0);
    let elapsedWidth = 0;

    for (let index = 0; index < rects.length; index++) {
      if (this.abortRequested) {
        return;
      }

      const rect = rects[index];
      const left = rect.left - hostRect.left + this.host.scrollLeft;
      const baseTop = rect.top - hostRect.top + this.host.scrollTop;
      const inset = Math.min(1, rect.height * 0.04);
      const top = baseTop + inset;
      const height = Math.max(1, rect.height - inset * 2);

      const wrap = document.createElement('span');
      wrap.className = HIGHLIGHT_INK_WRAP_CLASS;
      wrap.style.left = `${Math.max(0, left)}px`;
      wrap.style.top = `${Math.max(0, top)}px`;
      wrap.style.height = `${height}px`;
      wrap.style.width = '0px';
      wrap.style.opacity = '1';

      const ink = document.createElement('span');
      ink.className = HIGHLIGHT_INK_CLASS;

      wrap.appendChild(ink);

      this.layer.appendChild(wrap);
      this.activeInks.push(wrap);

      const paragraphProgress = totalWidth > 0 ? elapsedWidth / totalWidth : 0;
      const duration = this.computeDuration(rect.width, paragraphProgress);
      const easing = this.lineEasing(index, rects.length);

      await animate({
        duration,
        easing,
        shouldStop: () => this.abortRequested,
        update: (progress) => {
          wrap.style.width = `${rect.width * progress}px`;
        },
      });

      if (this.abortRequested) {
        return;
      }

      elapsedWidth += rect.width;
    }
  }

  private runFadeOut(): Promise<void> {
    if (!this.activeInks.length) {
      return Promise.resolve();
    }

    const inksToFade = [...this.activeInks];
    this.activeInks = [];

    const removals = inksToFade.map(
      (wrap) =>
        new Promise<void>((resolve) => {
          if (reduceMotion) {
            wrap.remove();
            resolve();
            return;
          }

          requestAnimationFrame(() => {
            wrap.classList.add(HIGHLIGHT_FADING_CLASS);
            wrap.style.transition = wrap.style.transition || 'opacity 180ms ease-out';
            wrap.style.opacity = '0';
            let resolved = false;
            const finalize = () => {
              if (resolved) return;
              resolved = true;
              wrap.remove();
              resolve();
            };
            wrap.addEventListener(
              'transitionend',
              finalize,
              { once: true }
            );
            window.setTimeout(finalize, 240);
          });
        })
    );

    return Promise.all(removals).then(() => undefined);
  }

  private removeResidualInks(): void {
    this.activeInks.forEach((wrap) => wrap.remove());
    this.layer.querySelectorAll(`.${HIGHLIGHT_INK_WRAP_CLASS}`).forEach((node) => node.remove());
    this.activeInks = [];
  }

  private measureTextRects(): DOMRect[] {
    const range = document.createRange();
    const rects: DOMRect[] = [];

    for (const node of Array.from(this.host.childNodes)) {
      if (node instanceof Element && node.classList.contains(HIGHLIGHT_LAYER_CLASS)) {
        continue; // Skip the ink layer itself so we only measure visible text.
      }

      range.selectNodeContents(node);
      rects.push(...Array.from(range.getClientRects()));
    }

    range.detach?.();
    return rects
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .sort((a, b) => a.top - b.top);
  }

  private computeDuration(lineWidth: number, progress: number): number {
    const speedFactor = this.paragraphSpeed(progress);
    const pxPerMs = lineWidth === 0 ? 0 : 1.5 * speedFactor;
    return pxPerMs === 0 ? 0 : Math.max(120, lineWidth / pxPerMs);
  }

  private paragraphSpeed(progress: number): number {
    const s = Math.sin(progress * Math.PI);
    return 0.8 + 2.6 * (s * s);
  }

  private lineEasing(lineIndex: number, totalLines: number): EasingFn {
    if (totalLines <= 1) return Easings.easeInQuint;
    if (lineIndex === 0) return Easings.easeInQuint;
    if (lineIndex === totalLines - 1) return Easings.easeOutQuint;
    return Easings.linear;
  }

  private clearInks(): void {
    this.activeInks.forEach((wrap) => wrap.remove());
    this.activeInks = [];
  }
}
