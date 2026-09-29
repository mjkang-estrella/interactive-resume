/**
 * Scales the resume paper down to fit narrow viewports (phones, small tablets)
 * by setting --paper-scale. Wider screens keep the paper at 100% and scroll.
 * Keep GUTTER in sync with --viewport-margin in the narrow-screen media query.
 */

const GUTTER = 16;

export class PaperFit {
  private rafId: number | null = null;

  constructor() {
    window.addEventListener('resize', this.schedule, { passive: true });
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
    const available = root.clientWidth - GUTTER * 2;
    const scale = Math.min(1, Math.max(0.1, available / paperWidth));
    root.style.setProperty('--paper-scale', scale.toFixed(4));
  }
}
