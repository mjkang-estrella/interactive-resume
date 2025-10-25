/**
 * Controls responsive scaling for the entire resume stage so it behaves like a PDF page.
 */
export class StageScaleController {
  private readonly paperWidth: number;
  private readonly paperHeight: number;
  private lastComputedScale = 1;
  private lastComputedMargin = 24;
  private rafId: number | null = null;
  private resizeObserver?: ResizeObserver;
  private deckObserver?: MutationObserver;
  private pageObserver?: MutationObserver;
  private readonly resizeHandler: () => void;

  constructor(
    private readonly stageShell: HTMLElement,
    private readonly stage: HTMLElement,
    private readonly page: HTMLElement,
    private readonly deck: HTMLElement,
    private readonly paper: HTMLElement
  ) {
    const paperRect = this.paper.getBoundingClientRect();
    this.paperWidth = Math.max(1, paperRect.width || this.paper.offsetWidth || 0);
    this.paperHeight = Math.max(1, paperRect.height || this.paper.offsetHeight || 0);

    this.resizeHandler = () => this.queueUpdate();

    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.queueUpdate());
      this.resizeObserver.observe(document.documentElement);
    }

    window.addEventListener('resize', this.resizeHandler, { passive: true });

    this.deckObserver = new MutationObserver(() => this.queueUpdate());
    this.deckObserver.observe(this.deck, {
      attributes: true,
      attributeFilter: ['hidden', 'class', 'style'],
    });

    this.pageObserver = new MutationObserver(() => this.queueUpdate());
    this.pageObserver.observe(this.page, { attributes: true, attributeFilter: ['class'] });

    this.queueUpdate();
  }

  private queueUpdate(): void {
    if (this.rafId !== null) {
      return;
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.applyScale();
    });
  }

  private applyScale(): void {
    const proposedMargin = this.computeMargin();
    const deckVisible = this.isDeckVisible();

    if (!deckVisible) {
      this.lastComputedMargin = proposedMargin;
      const stageWidth = this.paperWidth + this.lastComputedMargin * 2;
      const stageHeight = this.paperHeight + this.lastComputedMargin * 2;
      const widthScale = stageWidth > 0 ? Math.min(1, window.innerWidth / stageWidth) : 1;
      const heightScale = stageHeight > 0 ? Math.min(1, window.innerHeight / stageHeight) : 1;
      const rawScale = Math.min(widthScale, heightScale);
      this.lastComputedScale = Math.max(0.25, Math.min(rawScale, 1));
    }

    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--stage-scale', this.lastComputedScale.toFixed(4));
    rootStyle.setProperty('--viewport-margin', `${this.lastComputedMargin}px`);
  }

  private computeMargin(): number {
    const viewportMin = Math.min(window.innerWidth, window.innerHeight);
    const dynamic = viewportMin * 0.035;
    const clamped = Math.min(32, Math.max(16, dynamic));
    return Math.round(clamped);
  }

  private isDeckVisible(): boolean {
    if (this.deck.hidden) {
      return false;
    }
    if (this.page.classList.contains('deck-measuring-hide')) {
      return true;
    }
    return !this.page.classList.contains('deck-hidden');
  }
}
