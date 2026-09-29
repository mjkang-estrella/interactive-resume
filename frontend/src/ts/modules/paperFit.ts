/**
 * Fits the whole resume inside the viewport, preserving its printed proportions.
 * Opening a context page keeps the same scale. CSS supplies the outer margins.
 */

const GUTTER = 16;

export class PaperFit {
  private rafId: number | null = null;
  private page = document.querySelector<HTMLElement>('.page');
  private resizeObserver?: ResizeObserver;

  constructor() {
    window.addEventListener('resize', this.schedule, { passive: true });
    if (this.page && typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.schedule);
      this.resizeObserver.observe(this.page);
    }
    this.apply();
  }

  private schedule = (): void => {
    if (this.rafId !== null) {
      return;
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.apply();
    });
  };

  private apply(): void {
    const root = document.documentElement;
    const rootStyle = getComputedStyle(root);
    const paperWidth = parseFloat(rootStyle.getPropertyValue('--paper-width')) || 816;
    const paperHeight = parseFloat(rootStyle.getPropertyValue('--paper-height')) || 1056;
    // The page may reserve space for a vertical scrollbar. Fit its content
    // width so opening a long story cannot push the resume off a phone screen.
    const pageStyle = this.page ? getComputedStyle(this.page) : null;
    const availableWidth = this.page && pageStyle
      ? this.page.clientWidth - parseFloat(pageStyle.paddingLeft) - parseFloat(pageStyle.paddingRight)
      : root.clientWidth - GUTTER * 2;
    // Use the outer viewport height so a horizontal scrollbar when the second
    // sheet opens does not resize the resume. The margins leave room for it.
    const availableHeight = this.page && pageStyle
      ? this.page.getBoundingClientRect().height - parseFloat(pageStyle.paddingTop) - parseFloat(pageStyle.paddingBottom)
      : root.clientHeight - GUTTER * 2;
    const scale = Math.max(0.1, Math.min(availableWidth / paperWidth, availableHeight / paperHeight));
    // Round down so the rendered page never exceeds the available area.
    root.style.setProperty('--paper-scale', (Math.floor(scale * 10000) / 10000).toFixed(4));
  }
}
