/**
 * Main entry point for Interactive Resume
 */

import { $ } from './utils/dom';
import { MotionPreference } from './utils/motion';
import { TemplateLoader } from './modules/templateLoader';
import { AnimationController } from './modules/animationController';
import { DocManager } from './modules/docManager';
import { BulletHighlighter } from './modules/bulletHighlighter';
import { ResponsiveScaler } from './modules/responsiveScaler';

class InteractiveResume {
  private motionPreference!: MotionPreference;
  private templateLoader!: TemplateLoader;
  private animationController!: AnimationController;
  private docManager!: DocManager;
  private lastTrigger: HTMLElement | null = null;
  private activeBullet: HTMLButtonElement | null = null;
  private bulletHighlighters = new WeakMap<HTMLButtonElement, BulletHighlighter>();
  private responsiveScaler!: ResponsiveScaler;

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

    this.responsiveScaler = new ResponsiveScaler(page);

    this.prepareBulletHighlighters(paper);

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

  private setupBulletClickHandlers(toast: HTMLElement | null, paper: HTMLElement): void {
    paper.addEventListener('click', async (event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('.bullet');
      if (!target || !paper.contains(target)) {
        return;
      }

      this.lastTrigger = target;
      this.animationController.showDeck();
      this.responsiveScaler.requestUpdate();

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
      const finalize = () => {
        scrollToPaper();
        this.responsiveScaler.requestUpdate();
      };
      if (closing && typeof closing.then === 'function') {
        closing.then(finalize);
      } else {
        finalize();
      }
    });
  }

  private setupToast(toast: HTMLElement | null): void {
    if (!toast) return;

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
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
