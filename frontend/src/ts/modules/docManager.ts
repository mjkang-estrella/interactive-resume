/**
 * Document content manager
 */

import type { DocData } from '../types';
import type { TemplateLoader } from './templateLoader';
import type { AnimationController } from './animationController';

export class DocManager {
  constructor(
    private docContent: HTMLElement,
    private sub: HTMLElement | null,
    private title: HTMLElement | null,
    private doc: HTMLElement,
    private paper: HTMLElement,
    private templateLoader: TemplateLoader,
    private animationController: AnimationController
  ) {}

  private applyDocData({ section, roleTitle, bulletText, url }: DocData): void {
    const sectionSlot = this.docContent.querySelector<HTMLElement>("[data-slot='section']");
    if (sectionSlot) sectionSlot.textContent = section || '';

    const sectionLabelSlot = this.docContent.querySelector<HTMLElement>(
      "[data-slot='section-label']"
    );
    if (sectionLabelSlot) {
      sectionLabelSlot.textContent = section || 'Highlight';
    }

    const roleSlot = this.docContent.querySelector<HTMLElement>("[data-slot='role']");
    if (roleSlot) roleSlot.textContent = roleTitle || 'Role';

    const bulletSlot = this.docContent.querySelector<HTMLElement>("[data-slot='bullet']");
    if (bulletSlot) {
      if (bulletText != null) {
        bulletSlot.textContent = bulletText;
      } else if (!bulletSlot.textContent.trim()) {
        bulletSlot.textContent = 'Pick any bullet on the resume to populate this detail.';
      }
    }

    const embedContainer = this.docContent.querySelector<HTMLElement>(
      "[data-slot='embed-container']"
    );
    const embedFrame = this.docContent.querySelector<HTMLIFrameElement>(
      "[data-slot='embed-frame']"
    );

    if (embedFrame) {
      const isStaticEmbed =
        (embedContainer && embedContainer.hasAttribute('data-static-embed')) ||
        embedFrame.hasAttribute('data-static-embed');

      if (url) {
        embedFrame.src = url;
        if (embedContainer) {
          embedContainer.hidden = false;
          embedContainer.style.display = 'flex';
        } else {
          embedFrame.hidden = false;
        }
      } else if (isStaticEmbed) {
        if (embedContainer) {
          embedContainer.hidden = false;
          embedContainer.style.display = 'flex';
        } else {
          embedFrame.hidden = false;
        }
      } else {
        embedFrame.src = 'about:blank';
        if (embedContainer) {
          embedContainer.hidden = true;
          embedContainer.style.display = 'none';
        } else {
          embedFrame.hidden = true;
        }
      }
    }
  }

  public async populateDoc({ section, roleTitle, bulletText, url, template }: DocData): Promise<void> {
    if (this.sub) this.sub.textContent = section || 'Selected bullet';
    if (this.title) this.title.textContent = roleTitle || 'Detail view';

    const requestedTemplate = template || 'default';
    const loadAndRender = async () => {
      try {
        await this.templateLoader.loadTemplate(requestedTemplate, this.docContent);
      } catch (error) {
        if (requestedTemplate !== 'default') {
          await this.templateLoader.loadTemplate('default', this.docContent);
        } else {
          throw error;
        }
      }

      this.applyDocData({ section, roleTitle, bulletText, url });
      this.syncDocHeight();
    };

    const hasRenderableContent =
      this.docContent.childElementCount > 0 &&
      this.docContent.dataset &&
      this.docContent.dataset.template &&
      this.docContent.dataset.template !== 'default';

    if (hasRenderableContent && this.animationController.deckAnimationState === 'open') {
      await this.animationController.animateDocSwap(loadAndRender);
    } else {
      await loadAndRender();
    }
  }

  public syncDocHeight(): void {
    if (!this.doc || !this.paper) return;
    const paperHeight = this.paper.offsetHeight;
    this.doc.style.height = `${paperHeight}px`;
    this.doc.style.minHeight = `${paperHeight}px`;
    this.doc.style.maxHeight = `${paperHeight}px`;
  }

  public focusDoc(): void {
    this.doc.classList.add('focus');
    this.doc.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
    this.doc.focus({ preventScroll: true });
  }
}
