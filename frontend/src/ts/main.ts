/**
 * Main entry point for Interactive Resume
 */

import { $, $$ } from './utils/dom';
import { MotionPreference } from './utils/motion';
import { TemplateLoader } from './modules/templateLoader';
import { AnimationController } from './modules/animationController';
import { DocManager } from './modules/docManager';

class InteractiveResume {
  private motionPreference!: MotionPreference;
  private templateLoader!: TemplateLoader;
  private animationController!: AnimationController;
  private docManager!: DocManager;
  private lastTrigger: HTMLElement | null = null;

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

    // Set up event listeners
    this.setupBulletClickHandlers(toast);
    this.setupCloseButton(closeBtn, paper);
    this.setupToastAndHighlight(toast);

    // Initialize with default template
    this.docManager
      .populateDoc({ template: 'default' })
      .catch(() => {
        docContent.innerHTML = '<p>Unable to load resume details. Please refresh the page.</p>';
      });

    this.docManager.syncDocHeight();
    window.addEventListener('resize', () => this.docManager.syncDocHeight());
  }

  private setupBulletClickHandlers(toast: HTMLElement | null): void {
    $$<HTMLButtonElement>('.bullet').forEach((btn) => {
      btn.addEventListener('click', async () => {
        this.lastTrigger = btn;
        this.animationController.showDeck();

        if (toast) {
          toast.classList.remove('show');
        }

        const templateName = btn.getAttribute('data-doc');
        const dataText = btn.getAttribute('data-text');
        const bulletText = dataText !== null ? dataText : templateName ? null : btn.textContent?.trim();

        try {
          await this.docManager.populateDoc({
            section: btn.getAttribute('data-section') || undefined,
            roleTitle: btn.getAttribute('data-role') || undefined,
            bulletText,
            url: btn.getAttribute('data-url') || undefined,
            template: templateName || undefined,
          });
        } catch (error) {
          const docContent = $<HTMLElement>('#doc-content');
          if (docContent) {
            docContent.innerHTML =
              '<p>Unable to load resume details. Please refresh and try again.</p>';
          }
          console.error(error);
        }

        requestAnimationFrame(() => this.docManager.focusDoc());
      });
    });
  }

  private setupCloseButton(closeBtn: HTMLElement | null, paper: HTMLElement): void {
    if (!closeBtn) return;

    closeBtn.addEventListener('click', () => {
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

  private setupToastAndHighlight(toast: HTMLElement | null): void {
    if (toast) {
      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => {
        toast.classList.remove('show');
        this.triggerIntroHighlight();
      }, 3000);
    } else {
      this.triggerIntroHighlight();
    }
  }

  private triggerIntroHighlight(): void {
    const introBullet = $<HTMLElement>('.bullet--intro');
    if (introBullet) {
      introBullet.classList.add('pulsing');
      setTimeout(() => {
        introBullet.classList.remove('pulsing');
      }, 3000);
    }
  }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new InteractiveResume());
} else {
  new InteractiveResume();
}
