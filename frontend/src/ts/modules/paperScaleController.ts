/**
 * Controls responsive scaling for resume "paper" surfaces so they behave like fixed pages.
 */

export class PaperScaleController {
  private baseWidth: number;
  private baseHeight: number;
  private baseGap: number;
  private resizeObserver?: ResizeObserver;
  private resizeHandler: () => void;
  private deckObserver: MutationObserver | null = null;
  private pageObserver: MutationObserver | null = null;
  private resumeViewport: HTMLElement | null = null;
  private rafId: number | null = null;

  constructor(
    private page: HTMLElement,
    private paper: HTMLElement,
    private deck: HTMLElement
  ) {
    const { width, height } = this.measurePaper();
    this.baseWidth = width;
    this.baseHeight = height;
    this.baseGap = this.baseWidth * 0.04;

    this.resizeHandler = () => this.queueUpdate();

    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.queueUpdate());
      this.resizeObserver.observe(this.paper);
    }

    window.addEventListener('resize', this.resizeHandler, { passive: true });

    this.deckObserver = new MutationObserver(() => this.queueUpdate());
    this.deckObserver.observe(this.deck, { attributes: true, attributeFilter: ['hidden'] });

    this.pageObserver = new MutationObserver(() => this.queueUpdate());
    this.pageObserver.observe(this.page, { attributes: true, attributeFilter: ['class'] });

    this.queueUpdate();
  }

  private measurePaper(): { width: number; height: number } {
    const width = Math.max(1, this.paper.offsetWidth || 0);
    const height = Math.max(1, this.paper.offsetHeight || 0);
    return { width, height };
  }

  private queueUpdate(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.applyScale();
    });
  }

  private applyScale(): void {
    if (this.baseWidth <= 0 || this.baseHeight <= 0) {
      return;
    }

    const measuredWidth = Math.max(1, this.paper.offsetWidth || 0);
    const measuredHeight = Math.max(1, this.paper.offsetHeight || 0);

    if (Math.abs(measuredWidth - this.baseWidth) > 0.5) {
      this.baseWidth = measuredWidth;
      this.baseGap = this.baseWidth * 0.04;
    }

    if (Math.abs(measuredHeight - this.baseHeight) > 0.5) {
      this.baseHeight = measuredHeight;
    }

    const margin = this.computeMargin();
    const deckVisible = this.isDeckVisible();
    const columns = deckVisible ? 2 : 1;
    const totalWidth = this.baseWidth * columns + this.baseGap * Math.max(0, columns - 1);

    const availableWidth = Math.max(0, window.innerWidth - margin * 2);
    const availableHeight = Math.max(0, window.innerHeight - margin * 2);

    const widthScale = totalWidth > 0 ? availableWidth / totalWidth : 1;
    const heightScale = this.baseHeight > 0 ? availableHeight / this.baseHeight : 1;
    const rawScale = Math.min(1, widthScale, heightScale);
    const clampedScale = Math.max(0.1, Math.min(rawScale, 1));

    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--paper-scale', clampedScale.toFixed(4));
    rootStyle.setProperty('--viewport-margin', `${margin}px`);

    this.updateViewportAlignment(deckVisible);
  }

  private computeMargin(): number {
    const viewportMin = Math.min(window.innerWidth, window.innerHeight);
    const dynamic = viewportMin * 0.035;
    const clamped = Math.min(24, Math.max(16, dynamic));
    return Math.round(clamped);
  }

  private isDeckVisible(): boolean {
    if (this.deck.hidden || this.page.classList.contains('deck-hidden')) {
      return false;
    }
    return this.deck.offsetParent !== null;
  }

  private getResumeViewport(): HTMLElement | null {
    if (this.resumeViewport && this.resumeViewport.isConnected) {
      return this.resumeViewport;
    }
    this.resumeViewport = this.paper.closest<HTMLElement>(
      '.paper-viewport[data-paper-role="resume"]'
    );
    return this.resumeViewport;
  }

  private updateViewportAlignment(deckVisible: boolean): void {
    const resumeViewport = this.getResumeViewport();
    if (!resumeViewport) {
      return;
    }

    if (deckVisible) {
      resumeViewport.style.setProperty('--paper-translate', '0px');
      return;
    }

    resumeViewport.style.setProperty('--paper-translate', '0px');

    const pageRect = this.page.getBoundingClientRect();
    const viewportRect = resumeViewport.getBoundingClientRect();
    const targetCenter = pageRect.left + pageRect.width / 2;
    const currentCenter = viewportRect.left + viewportRect.width / 2;
    const shift = targetCenter - currentCenter;

    if (Math.abs(shift) > 0.5) {
      resumeViewport.style.setProperty('--paper-translate', `${shift}px`);
    }
  }
}
