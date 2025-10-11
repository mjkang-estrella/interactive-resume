/**
 * Motion preference detection and management
 */

export class MotionPreference {
  private motionQuery: MediaQueryList | null = null;
  private prefersReducedMotion = false;
  private pageElement: HTMLElement | null = null;

  constructor(pageElement: HTMLElement) {
    this.pageElement = pageElement;
    this.init();
  }

  private init(): void {
    if (!window.matchMedia) {
      this.applyPreference();
      return;
    }

    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = this.motionQuery.matches;
    this.applyPreference();

    const listener = (event: MediaQueryListEvent) => {
      this.prefersReducedMotion = event.matches;
      this.applyPreference();
    };

    if (typeof this.motionQuery.addEventListener === 'function') {
      this.motionQuery.addEventListener('change', listener);
    } else if (typeof (this.motionQuery as any).addListener === 'function') {
      (this.motionQuery as any).addListener(listener);
    }
  }

  private applyPreference(): void {
    if (!this.pageElement) return;

    if (this.prefersReducedMotion) {
      this.pageElement.classList.add('page--no-motion');
    } else {
      this.pageElement.classList.remove('page--no-motion');
    }
  }

  public shouldAnimate(): boolean {
    return !this.prefersReducedMotion && typeof Element.prototype.animate === 'function';
  }
}
