export class ResponsiveScaler {
  private rafId: number | null = null;
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private readonly minReadableScale = 0.42;

  constructor(private page: HTMLElement) {
    this.handleResize = this.handleResize.bind(this);

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize);
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.page);
    }

    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(this.handleResize);
      this.mutationObserver.observe(this.page, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    this.requestUpdate();
  }

  public requestUpdate(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.updateScale();
    });
  }

  private handleResize(): void {
    this.requestUpdate();
  }

  private updateScale(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 0) {
      return;
    }

    const naturalWidth = this.page.scrollWidth;
    if (naturalWidth <= 0) {
      return;
    }

    const widthScale = Math.min(1, viewportWidth / naturalWidth);
    const scale = widthScale > this.minReadableScale ? Math.max(this.minReadableScale, widthScale) : widthScale;

    document.documentElement.style.setProperty('--page-scale', scale.toFixed(4));
  }
}
