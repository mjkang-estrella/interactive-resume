const MIN_SCALE = 0.65;
const SCALE_EPSILON = 0.001;

const parseCssNumber = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export class ResponsiveScaler {
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private rafId: number | null = null;
  private lastScale = 1;

  constructor(
    private readonly page: HTMLElement,
    private readonly paper: HTMLElement,
    private readonly deck: HTMLElement,
    private readonly doc: HTMLElement
  ) {
    if (typeof window === 'undefined') {
      return;
    }

    this.handleResize = this.handleResize.bind(this);
    this.scheduleUpdate = this.scheduleUpdate.bind(this);
    this.applyScale = this.applyScale.bind(this);

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(this.scheduleUpdate);
      this.resizeObserver.observe(this.paper);
      this.resizeObserver.observe(this.doc);
    }

    this.mutationObserver = new MutationObserver(this.scheduleUpdate);
    this.mutationObserver.observe(this.page, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);

    this.scheduleUpdate();
  }

  public triggerUpdate(): void {
    this.scheduleUpdate();
  }

  private handleResize(): void {
    this.scheduleUpdate();
  }

  private scheduleUpdate(): void {
    if (this.rafId !== null) {
      return;
    }

    this.rafId = window.requestAnimationFrame(() => {
      this.rafId = null;
      this.applyScale();
    });
  }

  private applyScale(): void {
    const { targetWidth, targetHeight } = this.calculateTargetDimensions();

    if (targetWidth <= 0 || targetHeight <= 0) {
      this.clearScale();
      return;
    }

    const widthScale = window.innerWidth / targetWidth;
    const heightScale = window.innerHeight / targetHeight;

    let scale = Math.min(widthScale, heightScale, 1);
    if (!Number.isFinite(scale)) {
      scale = 1;
    }

    if (scale < MIN_SCALE) {
      scale = MIN_SCALE;
    }

    if (Math.abs(scale - 1) <= SCALE_EPSILON) {
      this.clearScale();
      return;
    }

    if (Math.abs(scale - this.lastScale) <= SCALE_EPSILON) {
      return;
    }

    this.page.style.setProperty('--page-scale', scale.toFixed(3));
    this.page.classList.add('page--scaled');
    this.lastScale = scale;
  }

  private clearScale(): void {
    if (this.lastScale === 1 && !this.page.classList.contains('page--scaled')) {
      return;
    }

    this.page.classList.remove('page--scaled');
    this.page.style.removeProperty('--page-scale');
    this.lastScale = 1;
  }

  private calculateTargetDimensions(): { targetWidth: number; targetHeight: number } {
    const rootStyles = getComputedStyle(document.documentElement);
    const pageStyles = getComputedStyle(this.page);

    const pageWidth = parseCssNumber(rootStyles.getPropertyValue('--page-width'));
    const padX = parseCssNumber(rootStyles.getPropertyValue('--page-pad-x'));
    const padY = parseCssNumber(rootStyles.getPropertyValue('--page-pad-y'));
    const pagePaddingX = parseCssNumber(pageStyles.paddingLeft) + parseCssNumber(pageStyles.paddingRight);
    const pagePaddingY = parseCssNumber(pageStyles.paddingTop) + parseCssNumber(pageStyles.paddingBottom);
    const gap = parseCssNumber(pageStyles.columnGap || pageStyles.gap);

    const deckVisible = !this.page.classList.contains('deck-hidden') || !this.deck.hidden;
    const columnWidth = pageWidth > 0 ? pageWidth + padX * 2 : this.paper.offsetWidth + padX * 2;

    const singleColumnWidth = columnWidth + pagePaddingX;
    const doubleColumnWidth = columnWidth * 2 + gap + pagePaddingX;

    const targetWidth = deckVisible ? doubleColumnWidth : singleColumnWidth;

    const paperHeight = this.paper.scrollHeight + padY * 2;
    const docHeight = deckVisible ? this.doc.scrollHeight + padY * 2 : 0;
    const targetHeight = Math.max(paperHeight, docHeight) + pagePaddingY;

    return { targetWidth, targetHeight };
  }
}
