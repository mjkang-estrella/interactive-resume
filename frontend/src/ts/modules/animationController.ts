/**
 * Animation controller for deck and doc transitions
 */

import type { AnimationState } from '../types';
import type { MotionPreference } from '../utils/motion';

// Animation keyframes
const deckEnterKeyframes: Keyframe[] = [
  { opacity: 0, transform: 'translateX(36px)' },
  { opacity: 1, transform: 'translateX(0)' },
];

const deckLeaveKeyframes: Keyframe[] = [
  { opacity: 1, transform: 'translateX(0)' },
  { opacity: 0, transform: 'translateX(40px)' },
];

const docSwapOutKeyframes: Keyframe[] = [
  { opacity: 1, transform: 'translateY(0)' },
  { opacity: 0, transform: 'translateY(8px)' },
];

const docSwapInKeyframes: Keyframe[] = [
  { opacity: 0, transform: 'translateY(8px)' },
  { opacity: 1, transform: 'translateY(0)' },
];

// Animation timing
const deckEnterTiming: KeyframeAnimationOptions = {
  duration: 340,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  fill: 'forwards',
};

const deckLeaveTiming: KeyframeAnimationOptions = {
  duration: 260,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fill: 'forwards',
};

const paperEnterTiming: KeyframeAnimationOptions = {
  duration: 340,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  fill: 'both',
};

const paperLeaveTiming: KeyframeAnimationOptions = {
  duration: 260,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fill: 'none',
};

const docEnterTiming: KeyframeAnimationOptions = {
  duration: 360,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  fill: 'forwards',
  delay: 40,
};

const docLeaveTiming: KeyframeAnimationOptions = {
  duration: 260,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fill: 'forwards',
};

const docSwapOutTiming: KeyframeAnimationOptions = {
  duration: 150,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fill: 'forwards',
};

const docSwapInTiming: KeyframeAnimationOptions = {
  duration: 220,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  fill: 'forwards',
  delay: 30,
};

export class AnimationController {
  private deckAnimationInstance: Animation | null = null;
  private docAnimationInstance: Animation | null = null;
  private docContentSwapAnimation: Animation | null = null;
  public deckAnimationState: AnimationState = 'closed';

  constructor(
    private deck: HTMLElement,
    private doc: HTMLElement,
    private docContent: HTMLElement,
    private paper: HTMLElement,
    private page: HTMLElement,
    private motionPreference: MotionPreference
  ) {
    this.deckAnimationState = deck.hidden ? 'closed' : 'open';
  }

  private getCurrentScale(): number {
    const rootStyles = getComputedStyle(document.documentElement);
    const scaleValue = rootStyles.getPropertyValue('--paper-scale').trim();
    const parsed = parseFloat(scaleValue);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  private composePaperTransform(deltaX: number): string {
    const scale = this.getCurrentScale();
    const translatePart = Math.abs(deltaX) < 0.01 ? '' : `translateX(${deltaX}px)`;
    const scalePart = Math.abs(scale - 1) < 0.0001 ? '' : `scale(${scale})`;
    if (!translatePart && !scalePart) {
      return 'none';
    }
    return [translatePart, scalePart].filter(Boolean).join(' ');
  }

  private composeDocTransform(deltaX: number, scaleMultiplier: number): string {
    const scale = this.getCurrentScale();
    const translatePart = Math.abs(deltaX) < 0.01 ? '' : `translateX(${deltaX}px)`;
    const scaleValue = Math.max(0.01, scale * scaleMultiplier);
    const scalePart = `scale(${scaleValue.toFixed(4)})`;
    return [translatePart, scalePart].filter(Boolean).join(' ');
  }

  private buildDocEnterKeyframes(): Keyframe[] {
    return [
      { opacity: 0, transform: this.composeDocTransform(18, 0.98) },
      { opacity: 1, transform: this.composeDocTransform(0, 1) },
    ];
  }

  private buildDocLeaveKeyframes(): Keyframe[] {
    return [
      { opacity: 1, transform: this.composeDocTransform(0, 1) },
      { opacity: 0, transform: this.composeDocTransform(12, 0.97) },
    ];
  }

  private cleanupDocAnimation(): void {
    if (this.docAnimationInstance) {
      this.docAnimationInstance.cancel();
      this.docAnimationInstance = null;
    }
  }

  private cleanupDeckAnimation(): void {
    if (this.deckAnimationInstance) {
      this.deckAnimationInstance.cancel();
      this.deckAnimationInstance = null;
    }
  }

  private cleanupDocContentAnimation(): void {
    if (this.docContentSwapAnimation) {
      this.docContentSwapAnimation.cancel();
      this.docContentSwapAnimation = null;
    }
  }

  private resetDeckPositioning(): void {
    this.deck.style.removeProperty('position');
    this.deck.style.removeProperty('top');
    this.deck.style.removeProperty('left');
    this.deck.style.removeProperty('width');
    this.deck.style.removeProperty('height');
    this.deck.style.removeProperty('pointer-events');
    this.deck.style.removeProperty('z-index');
    this.page.classList.remove('deck-measuring-hide');
  }

  public async animateDocSwap(callback: () => Promise<void>): Promise<void> {
    if (
      !callback ||
      !this.motionPreference.shouldAnimate() ||
      this.deckAnimationState !== 'open'
    ) {
      this.cleanupDocContentAnimation();
      await callback();
      return;
    }

    this.cleanupDocContentAnimation();
    const outbound = this.docContent.animate(docSwapOutKeyframes, docSwapOutTiming);
    this.docContentSwapAnimation = outbound;

    try {
      await outbound.finished;
    } catch {
      if (this.docContentSwapAnimation !== outbound) {
        return;
      }
    }

    if (this.docContentSwapAnimation !== outbound) {
      return;
    }

    let callbackError: Error | undefined;
    try {
      await callback();
    } catch (error) {
      callbackError = error as Error;
    }

    const inbound = this.docContent.animate(docSwapInKeyframes, docSwapInTiming);
    this.docContentSwapAnimation = inbound;

    try {
      await inbound.finished;
    } catch {
      /* ignore */
    } finally {
      if (this.docContentSwapAnimation === inbound) {
        this.docContentSwapAnimation = null;
      }
    }

    if (callbackError) {
      throw callbackError;
    }
  }

  public showDeck(): void {
    const wasClosed =
      this.deck.hidden ||
      this.page.classList.contains('deck-hidden') ||
      this.deckAnimationState === 'closing' ||
      this.deckAnimationState === 'closed';

    this.cleanupDeckAnimation();
    this.cleanupDocAnimation();
    this.cleanupDocContentAnimation();
    this.resetDeckPositioning();

    if (!wasClosed) {
      this.deckAnimationState = 'open';
      this.deck.hidden = false;
      this.page.classList.remove('deck-hidden');
      return;
    }

    const shouldAnimate = this.motionPreference.shouldAnimate();
    let paperDeltaX = 0;
    let paperAnimation: Animation | null = null;

    let paperFirstRect: DOMRect | null = null;
    if (shouldAnimate) {
      paperFirstRect = this.paper.getBoundingClientRect();
    }

    this.deck.hidden = false;
    this.page.classList.remove('deck-hidden');
    this.page.scrollLeft = 0;

    if (!shouldAnimate) {
      this.deckAnimationState = 'open';
      return;
    }

    const paperLastRect = this.paper.getBoundingClientRect();
    if (paperFirstRect) {
      paperDeltaX = paperFirstRect.left - paperLastRect.left;
    }

    this.deckAnimationState = 'opening';

    if (paperDeltaX !== 0) {
      const fromTransform = this.composePaperTransform(paperDeltaX);
      const toTransform = this.composePaperTransform(0);
      paperAnimation = this.paper.animate(
        [
          { transform: fromTransform },
          { transform: toTransform },
        ],
        paperEnterTiming
      );
      const cleanupPaper = () => {
        paperAnimation = null;
      };
      paperAnimation.addEventListener('finish', cleanupPaper);
      paperAnimation.addEventListener('cancel', cleanupPaper);
    }

    this.deckAnimationInstance = this.deck.animate(deckEnterKeyframes, deckEnterTiming);
    this.docAnimationInstance = this.doc.animate(this.buildDocEnterKeyframes(), docEnterTiming);

    this.deckAnimationInstance.addEventListener('finish', () => {
      this.deckAnimationInstance = null;
      this.deckAnimationState = 'open';
    });
    this.deckAnimationInstance.addEventListener('cancel', () => {
      this.deckAnimationInstance = null;
    });

    const docCleanup = () => {
      this.docAnimationInstance = null;
    };
    this.docAnimationInstance.addEventListener('finish', docCleanup);
    this.docAnimationInstance.addEventListener('cancel', docCleanup);
  }

  public hideDeck(): Promise<boolean> {
    if (
      this.deck.hidden ||
      this.deckAnimationState === 'closed' ||
      this.deckAnimationState === 'closing'
    ) {
      return Promise.resolve(this.deckAnimationState === 'closed');
    }

    this.cleanupDeckAnimation();
    this.cleanupDocAnimation();
    this.cleanupDocContentAnimation();

    const shouldAnimate = this.motionPreference.shouldAnimate();

    if (!shouldAnimate) {
      this.resetDeckPositioning();
      this.deck.hidden = true;
      this.page.classList.add('deck-hidden');
      this.page.scrollLeft = 0;
      this.deckAnimationState = 'closed';
      this.doc.classList.remove('focus');
      return Promise.resolve(true);
    }

    const paperFirstRect = this.paper.getBoundingClientRect();
    const pageRect = this.page.getBoundingClientRect();
    const deckRect = this.deck.getBoundingClientRect();
    const initialScrollLeft = this.page.scrollLeft;

    this.page.classList.add('deck-measuring-hide');
    this.deck.style.position = 'absolute';
    this.deck.style.left = `${deckRect.left - pageRect.left}px`;
    this.deck.style.top = `${deckRect.top - pageRect.top}px`;
    this.deck.style.width = `${deckRect.width}px`;
    this.deck.style.height = `${deckRect.height}px`;
    this.deck.style.pointerEvents = 'none';
    this.deck.style.zIndex = '2';

    if (initialScrollLeft !== 0) {
      this.page.scrollLeft = 0;
    }

    const paperLastRect = this.paper.getBoundingClientRect();

    if (initialScrollLeft !== 0) {
      this.page.scrollLeft = initialScrollLeft;
    }
    const deltaX = paperFirstRect.left - paperLastRect.left;

    this.deckAnimationState = 'closing';
    this.doc.classList.remove('focus');

    let paperAnimation: Animation | null = null;
    if (deltaX !== 0) {
      const fromTransform = this.composePaperTransform(deltaX);
      const toTransform = this.composePaperTransform(0);
      paperAnimation = this.paper.animate(
        [
          { transform: fromTransform },
          { transform: toTransform },
        ],
        paperLeaveTiming
      );
    }

    this.deckAnimationInstance = this.deck.animate(deckLeaveKeyframes, deckLeaveTiming);
    this.docAnimationInstance = this.doc.animate(this.buildDocLeaveKeyframes(), docLeaveTiming);

    if (initialScrollLeft !== 0) {
      if (typeof this.page.scrollTo === 'function') {
        this.page.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        this.page.scrollLeft = 0;
      }
    }

    const finishPromise = new Promise<boolean>((resolve) => {
      const finalize = () => {
        this.resetDeckPositioning();
        this.deck.hidden = true;
        this.page.classList.add('deck-hidden');
        this.deckAnimationState = 'closed';
        this.deckAnimationInstance = null;
        this.doc.classList.remove('focus');
        resolve(true);
      };

      this.deckAnimationInstance!.addEventListener('finish', finalize);
      this.deckAnimationInstance!.addEventListener('cancel', () => {
        this.deckAnimationInstance = null;
        const isClosed = this.deck.hidden || this.page.classList.contains('deck-hidden');
        this.resetDeckPositioning();
        this.deckAnimationState = isClosed ? 'closed' : 'open';
        if (isClosed) {
          this.doc.classList.remove('focus');
        }
        resolve(isClosed);
      });

      const docCleanup = () => {
        this.docAnimationInstance = null;
      };
      this.docAnimationInstance!.addEventListener('finish', docCleanup);
      this.docAnimationInstance!.addEventListener('cancel', docCleanup);

      if (paperAnimation) {
        const cleanupPaper = () => {
          paperAnimation!.removeEventListener('finish', cleanupPaper);
          paperAnimation!.removeEventListener('cancel', cleanupPaper);
        };
        paperAnimation.addEventListener('finish', cleanupPaper);
        paperAnimation.addEventListener('cancel', cleanupPaper);
      }
    });

    return finishPromise;
  }
}
