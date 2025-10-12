/**
 * Template loading and caching
 */

const TEMPLATE_MANIFEST = import.meta.glob<string>(
  '../../pages/doc-pages/*.html',
  {
    eager: true,
    query: '?raw',
    import: 'default',
  }
) as Record<string, string>;

const TEMPLATE_CACHE = new Map<string, string>();
for (const [importPath, markup] of Object.entries(TEMPLATE_MANIFEST)) {
  const normalized =
    importPath
      .replace('../../pages/doc-pages/', '')
      .replace(/\.html(\?raw)?$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '') || 'default';
  TEMPLATE_CACHE.set(normalized, markup);
}

export class TemplateLoader {
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

    const markup = TEMPLATE_CACHE.get(templateName);
    if (!markup) {
      throw new Error(`Unable to load template: ${templateName}`);
    }

    docContent.innerHTML = markup;
    docContent.dataset.template = templateName;
    this.activeTemplate = templateName;
    return templateName;
  }
}
