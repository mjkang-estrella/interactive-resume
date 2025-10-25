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
    this.setupToast(toast);

    // Initialize with default template
    this.docManager
      .populateDoc({ template: 'default' })
      .catch(() => {
        docContent.innerHTML = '<p>Unable to load resume details. Please refresh the page.</p>';
      });

    this.docManager.syncDocHeight();
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

  private setupToast(toast: HTMLElement | null): void {
    if (!toast) return;

    toast.classList.remove('show');
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
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new InteractiveResume());
} else {
  new InteractiveResume();
}
