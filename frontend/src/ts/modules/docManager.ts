/**
 * Document content manager
 */

import type { DocData } from '../types';
import type { TemplateLoader } from './templateLoader';
import type { AnimationController } from './animationController';

export class DocManager {
  private resizeObserver?: ResizeObserver;
  private fallbackResizeHandler?: () => void;

  constructor(
    private docContent: HTMLElement,
    private sub: HTMLElement | null,
    private title: HTMLElement | null,
    private doc: HTMLElement,
    private paper: HTMLElement,
    private templateLoader: TemplateLoader,
    private animationController: AnimationController
  ) {
    if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          this.syncDocHeight(entry.contentRect.height);
        }
      });
      this.resizeObserver.observe(this.paper);
    } else if (typeof window !== 'undefined') {
      this.fallbackResizeHandler = () => this.syncDocHeight();
      window.addEventListener('resize', this.fallbackResizeHandler);
    }
  }

  private applyDocData({ section, roleTitle, bulletText }: DocData): void {
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
        bulletSlot.textContent = 'Select any bullet on the resume to see the story behind it.';
      }
    }
  }

  public async populateDoc({ section, roleTitle, bulletText, template }: DocData): Promise<void> {
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

      this.applyDocData({ section, roleTitle, bulletText });
      // Each story starts at its title, even after scrolling a longer one.
      const body = this.doc.querySelector<HTMLElement>('.doc-body');
      if (body) body.scrollTop = 0;
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

  public syncDocHeight(measuredHeight?: number): void {
    if (!this.doc || !this.paper) return;
    const baseHeight =
      typeof measuredHeight === 'number' ? measuredHeight : this.paper.offsetHeight;
    const roundedHeight = Math.round(baseHeight);
    this.doc.style.height = `${roundedHeight}px`;
    this.doc.style.minHeight = `${roundedHeight}px`;
    this.doc.style.maxHeight = `${roundedHeight}px`;
  }

  public focusDoc(): void {
    this.doc.classList.add('focus');
    this.doc.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
    this.doc.focus({ preventScroll: true });
  }
}
