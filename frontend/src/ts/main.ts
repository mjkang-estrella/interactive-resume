/**
 * Main entry point for Interactive Resume
 */

import { $ } from './utils/dom';
import { MotionPreference } from './utils/motion';
import { TemplateLoader } from './modules/templateLoader';
import { AnimationController } from './modules/animationController';
import { DocManager } from './modules/docManager';
import { BulletHighlighter } from './modules/bulletHighlighter';
import { CompanyTooltip } from './modules/companyTooltip';
import { WaitlistPopup } from './modules/waitlistPopup';

class InteractiveResume {
  private motionPreference!: MotionPreference;
  private templateLoader!: TemplateLoader;
  private animationController!: AnimationController;
  private docManager!: DocManager;
  private lastTrigger: HTMLElement | null = null;
  private activeBullet: HTMLButtonElement | null = null;
  private bulletHighlighters = new WeakMap<HTMLButtonElement, BulletHighlighter>();
  private companyTooltip?: CompanyTooltip;
  private hasDocumentOpened = false;
  private onboardingTimeout: number | null = null;
  private onboardingCursor: HTMLDivElement | null = null;
  private onboardingTimeout: number | null = null;
  private onboardingCursor: HTMLDivElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // Get DOM elements
    const page = $<HTMLElement>('.page');
    const deck = $<HTMLElement>('#deck');
    const doc = $<HTMLElement>('#deck-doc');
    const docContent = $<HTMLElement>('#doc-content');
    const paper = $<HTMLElement>('#paper');

    if (!page || !deck || !doc || !paper || !docContent) {
      console.error('[InteractiveResume] Required DOM elements not found');
      return;
    }

    const sub = $<HTMLElement>('.doc-sub', doc);
    const title = $<HTMLElement>('.doc-title', doc);
    const closeBtn = $<HTMLElement>('.doc-close', doc);
    const toast = $<HTMLElement>('#tip-toast');

    this.setupDeckLayoutWatcher(page, deck);

    // Initialize modules
    this.motionPreference = new MotionPreference(page);
    this.templateLoader = new TemplateLoader();
    this.animationController = new AnimationController(
      deck,
      doc,
      docContent,
      paper,
      page,
      this.motionPreference
    );
    this.docManager = new DocManager(
      docContent,
      sub,
      title,
      doc,
      paper,
      this.templateLoader,
      this.animationController
    );

    this.prepareBulletHighlighters(paper);
    this.companyTooltip = new CompanyTooltip(paper);

    // Set up event listeners
    this.setupBulletClickHandlers(toast, paper);
    this.setupCloseButton(closeBtn, paper);

    // Initialize with default template
    this.docManager
      .populateDoc({ template: 'default' })
      .catch(() => {
        docContent.innerHTML = '<p>Unable to load resume details. Please refresh the page.</p>';
      });

    this.docManager.syncDocHeight();
    this.scheduleResumeOsOnboarding(paper);

    new WaitlistPopup();
  }

  private prepareBulletHighlighters(paper: HTMLElement): void {
    const bullets = paper.querySelectorAll<HTMLButtonElement>('.bullet');
    bullets.forEach((button) => {
      const highlighter = BulletHighlighter.create(button);
      if (highlighter) {
        this.bulletHighlighters.set(button, highlighter);
      }
    });
  }

  private setupDeckLayoutWatcher(page: HTMLElement, deck: HTMLElement): void {
    let rafId: number | null = null;

    const updateAlignment = () => {
      rafId = null;
      const deckVisible = !deck.hidden && !page.classList.contains('deck-hidden');
      if (!deckVisible) {
        page.classList.remove('page--deck-center');
        return;
      }

      const overflowAllowance = 1;
      const hasOverflow = page.scrollWidth - page.clientWidth > overflowAllowance;
      page.classList.toggle('page--deck-center', !hasOverflow);
    };

    const scheduleUpdate = () => {
      if (rafId !== null) {
        return;
      }
      rafId = requestAnimationFrame(updateAlignment);
    };

    window.addEventListener('resize', scheduleUpdate, { passive: true });

    if (typeof ResizeObserver === 'function') {
      const resizeObserver = new ResizeObserver(() => scheduleUpdate());
      resizeObserver.observe(page);
      resizeObserver.observe(deck);
    }

    const mutationObserver = new MutationObserver(() => scheduleUpdate());
    mutationObserver.observe(deck, { attributes: true, attributeFilter: ['hidden'] });
    mutationObserver.observe(page, { attributes: true, attributeFilter: ['class'] });

    scheduleUpdate();
  }

  private setupBulletClickHandlers(toast: HTMLElement | null, paper: HTMLElement): void {
    paper.addEventListener('click', async (event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('.bullet');
      if (!target || !paper.contains(target)) {
        return;
      }

      this.lastTrigger = target;
      this.animationController.showDeck();

      if (toast) {
        toast.classList.remove('show');
      }

      const templateName = target.getAttribute('data-doc');
      const dataText = target.getAttribute('data-text');
      const bulletText =
        dataText !== null ? dataText : templateName ? null : target.textContent?.trim();

      try {
        await this.docManager.populateDoc({
          section: target.getAttribute('data-section') || undefined,
          roleTitle: target.getAttribute('data-role') || undefined,
          bulletText,
          url: target.getAttribute('data-url') || undefined,
          template: templateName || undefined,
        });
        await this.setActiveBullet(target);
      } catch (error) {
        await this.clearActiveBullet();
        const docContent = $<HTMLElement>('#doc-content');
        if (docContent) {
          docContent.innerHTML =
            '<p>Unable to load resume details. Please refresh and try again.</p>';
        }
        console.error(error);
      }

      requestAnimationFrame(() => this.docManager.focusDoc());
    });
  }

  private setupToast(toast: HTMLElement | null): void {
    if (!toast) return;

    toast.classList.remove('show');
  }

  private setupCloseButton(closeBtn: HTMLElement | null, paper: HTMLElement): void {
    if (!closeBtn) return;

    closeBtn.addEventListener('click', async () => {
      await this.clearActiveBullet();
      const closing = this.animationController.hideDeck();
      if (this.lastTrigger) {
        this.lastTrigger.focus();
      }
      const scrollToPaper = () => {
        paper.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      };
      if (closing && typeof closing.then === 'function') {
        closing.then(scrollToPaper);
      } else {
        scrollToPaper();
      }
    });
  }


  private async setActiveBullet(bullet: HTMLButtonElement): Promise<void> {
    if (this.activeBullet && this.activeBullet !== bullet) {
      const previous = this.activeBullet;
      const previousHighlighter = this.bulletHighlighters.get(previous);
      previous.classList.remove('bullet--active');
      await previousHighlighter?.fadeOut();
    } else if (this.activeBullet === bullet) {
      const currentHighlighter = this.bulletHighlighters.get(bullet);
      await currentHighlighter?.fadeOut();
    }

    this.activeBullet = bullet;
    this.activeBullet.classList.add('bullet--active');
    this.hasDocumentOpened = true;

    const highlighter = this.bulletHighlighters.get(bullet);
    highlighter?.highlight();
  }

  private async clearActiveBullet(): Promise<void> {
    if (!this.activeBullet) {
      return;
    }

    const bullet = this.activeBullet;
    const highlighter = this.bulletHighlighters.get(bullet);

    this.activeBullet = null;
    bullet.classList.remove('bullet--active');
    await highlighter?.fadeOut();
  }

  private scheduleResumeOsOnboarding(paper: HTMLElement): void {
    if (this.hasDocumentOpened) {
      return;
    }

    if (this.onboardingTimeout !== null) {
      window.clearTimeout(this.onboardingTimeout);
    }

    this.onboardingTimeout = window.setTimeout(() => {
      this.onboardingTimeout = null;
      this.playResumeOsOnboarding(paper);
    }, 800);
  }

  private playResumeOsOnboarding(paper: HTMLElement): void {
    if (this.hasDocumentOpened) {
      return;
    }

    const targetBullet = paper.querySelector<HTMLButtonElement>(
      '.bullet[data-doc="additional-resume-os"]',
    );

    if (!targetBullet) {
      return;
    }

    const cursor = document.createElement('div');
    cursor.className = 'cursor-onboarding';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.append(cursor);
    this.onboardingCursor = cursor;

    const timeouts: number[] = [];
    const schedule = (callback: () => void, delay: number) => {
      const id = window.setTimeout(() => {
        timeouts.splice(timeouts.indexOf(id), 1);
        callback();
      }, delay);
      timeouts.push(id);
      return id;
    };

    let cleaning = false;
    const cleanup = (immediate = false) => {
      if (cleaning) {
        return;
      }
      cleaning = true;
      timeouts.forEach((id) => window.clearTimeout(id));
      timeouts.length = 0;
      if (this.onboardingTimeout !== null) {
        window.clearTimeout(this.onboardingTimeout);
        this.onboardingTimeout = null;
      }
      const cursorEl = this.onboardingCursor;
      this.onboardingCursor = null;
      if (cursorEl) {
        cursorEl.style.transition = '';
        if (immediate) {
          cursorEl.remove();
        } else {
          cursorEl.style.transition = 'opacity 0.35s ease, transform 0.32s ease';
          cursorEl.style.opacity = '0';
          cursorEl.style.transform = 'scale(0.9)';
          const handle = (event: TransitionEvent) => {
            if (event.propertyName !== 'opacity') {
              return;
            }
            cursorEl.removeEventListener('transitionend', handle);
            cursorEl.remove();
          };
          cursorEl.addEventListener('transitionend', handle);
        }
      }
      window.removeEventListener('pointerdown', cancelOnUserInteraction);
      window.removeEventListener('scroll', cancelOnUserInteraction);
    };

    const cancelOnUserInteraction = () => {
      cleanup(true);
    };

    window.addEventListener('pointerdown', cancelOnUserInteraction, { once: true });
    window.addEventListener('scroll', cancelOnUserInteraction, { passive: true });

    targetBullet.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });

    const startAnimation = (rect: DOMRect) => {
      if (!this.onboardingCursor) {
        return;
      }

      const TIP_OFFSET_X = 0;
      const TIP_OFFSET_Y = 0;
      const startLeft = window.innerWidth / 2 - TIP_OFFSET_X;
      const startTop = window.innerHeight / 2 - TIP_OFFSET_Y;
      const targetLeft = rect.left + rect.width / 2 - TIP_OFFSET_X;
      const targetTop = rect.top + rect.height / 2 - TIP_OFFSET_Y;

      this.onboardingCursor.style.transition = 'none';
      this.onboardingCursor.style.left = `${startLeft}px`;
      this.onboardingCursor.style.top = `${startTop}px`;
      this.onboardingCursor.style.opacity = '0';
      this.onboardingCursor.style.transform = 'scale(1)';

      void this.onboardingCursor.offsetWidth;

      requestAnimationFrame(() => {
        if (!this.onboardingCursor) {
          return;
        }
        this.onboardingCursor.style.transition =
          'top 1.3s cubic-bezier(0.22, 1, 0.36, 1), left 1.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease, transform 0.32s ease';
        this.onboardingCursor.style.opacity = '1';
        this.onboardingCursor.style.top = `${targetTop}px`;
        this.onboardingCursor.style.left = `${targetLeft}px`;
      });

      const travelDuration = 1300;
      schedule(() => {
        if (!this.onboardingCursor) {
          return;
        }
        this.onboardingCursor.style.transform = 'scale(0.9)';
      }, travelDuration - 120);

      schedule(() => {
        if (!this.onboardingCursor) {
          cleanup();
          return;
        }
        this.onboardingCursor.style.transform = 'scale(1)';
        targetBullet.click();
        cleanup();
      }, travelDuration + 220);
    };

    const waitForVisibility = (attempt = 0) => {
      if (!this.onboardingCursor) {
        return;
      }

      const rect = targetBullet.getBoundingClientRect();
      const fullyVisible =
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.left >= 0 &&
        rect.right <= window.innerWidth;

      if (fullyVisible || attempt > 60) {
        startAnimation(rect);
        return;
      }

      requestAnimationFrame(() => waitForVisibility(attempt + 1));
    };

    requestAnimationFrame(() => waitForVisibility());
  }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new InteractiveResume());
} else {
  new InteractiveResume();
}
