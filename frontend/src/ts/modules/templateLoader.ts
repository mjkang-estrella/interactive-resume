/**
 * Template loading and caching
 */

const TEMPLATE_DIR = 'pages/doc-pages';

export class TemplateLoader {
  private templateCache = new Map<string, string>();
  private activeTemplate: string | null = null;

  public getActiveTemplate(): string | null {
    return this.activeTemplate;
  }

  private normalizeTemplateName(name?: string): string {
    if (!name) return 'default';
    const cleaned = name.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    return cleaned || 'default';
  }

  public async loadTemplate(
    requested: string | undefined,
    docContent: HTMLElement
  ): Promise<string> {
    const templateName = this.normalizeTemplateName(requested);

    if (
      this.activeTemplate === templateName &&
      docContent.dataset.template === templateName
    ) {
      return templateName;
    }

    if (!this.templateCache.has(templateName)) {
      const response = await fetch(`${TEMPLATE_DIR}/${templateName}.html`);
      if (!response.ok) {
        throw new Error(`Unable to load template: ${templateName}`);
      }
      const markup = await response.text();
      this.templateCache.set(templateName, markup);
    }

    docContent.innerHTML = this.templateCache.get(templateName) || '';
    docContent.dataset.template = templateName;
    this.activeTemplate = templateName;
    return templateName;
  }
}
