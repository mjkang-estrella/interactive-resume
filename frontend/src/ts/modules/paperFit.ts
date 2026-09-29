/**
 * Scales the resume paper down to fit narrow viewports (phones, small tablets)
 * by setting --paper-scale. Wider screens keep the paper at 100% and scroll.
 * Keep GUTTER in sync with --viewport-margin in the narrow-screen media query.
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
    const paperWidth = parseFloat(getComputedStyle(root).getPropertyValue('--paper-width')) || 816;
    // The page may reserve space for a vertical scrollbar. Fit its content
    // width so opening a long story cannot push the resume off a phone screen.
    const pageStyle = this.page ? getComputedStyle(this.page) : null;
    const available = this.page && pageStyle
      ? this.page.clientWidth - parseFloat(pageStyle.paddingLeft) - parseFloat(pageStyle.paddingRight)
      : root.clientWidth - GUTTER * 2;
    const scale = Math.min(1, Math.max(0.1, available / paperWidth));
    root.style.setProperty('--paper-scale', scale.toFixed(4));
  }
}
