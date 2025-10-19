const COMPANY_DETAILS: Record<string, { html: string }> = {
  haas: {
    html: `Hub of technology and Innovation.</br> Go Bears!`,
  },
  kaist: {
    html: `<b>Korea Advanced Institute of Science and
    Technology</b></br>South Korea's MIT-like university, known for its strong focus on research and innovation.`,
  },
  'toss-bank': {
    html: `Korea's largest fintech company`,
  },
  doeat: {
    html: `Series‑A Food Delivery Startup with 50 employees`,
  },
  hyperconnect: {
    html: `Global Live streaming platform`,
  },
};

const TOOLTIP_MARGIN = 16;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export class CompanyTooltip {
  private tooltipEl: HTMLDivElement | null = null;
  private activeEl: HTMLElement | null = null;
  private positionFrame: number | null = null;

  constructor(root: HTMLElement) {
    const companyElements = Array.from(
      root.querySelectorAll<HTMLElement>('.company[data-company]')
    );

    if (companyElements.length === 0) {
      return;
    }

    this.tooltipEl = document.createElement('div');
    this.tooltipEl.id = 'company-tooltip';
    this.tooltipEl.className = 'company-tooltip';
    this.tooltipEl.setAttribute('role', 'tooltip');
    this.tooltipEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.tooltipEl);

    companyElements.forEach((element) => {
      element.addEventListener('mouseenter', () => this.show(element));
      element.addEventListener('mouseleave', () => this.hide(element));
      element.addEventListener('focus', () => this.show(element));
      element.addEventListener('blur', () => this.hide(element));
    });

    window.addEventListener('scroll', this.handleViewportChange, { passive: true });
    window.addEventListener('resize', this.handleViewportChange, { passive: true });
  }

  private handleViewportChange = () => {
    if (!this.activeEl) {
      return;
    }
    this.schedulePosition();
  };

  private show(element: HTMLElement): void {
    const tooltip = this.tooltipEl;
    if (!tooltip) {
      return;
    }

    const companyId = element.dataset.company;
    if (!companyId) {
      return;
    }

    const detail = COMPANY_DETAILS[companyId];
    if (!detail) {
      return;
    }

    this.activeEl = element;
    tooltip.innerHTML = detail.html;
    tooltip.setAttribute('aria-hidden', 'false');
    element.setAttribute('aria-describedby', tooltip.id);
    tooltip.classList.add('company-tooltip--visible');
    tooltip.classList.remove('company-tooltip--above');
    this.schedulePosition(true);
  }

  private hide(element: HTMLElement): void {
    if (this.activeEl !== element) {
      element.removeAttribute('aria-describedby');
      return;
    }

    const tooltip = this.tooltipEl;
    if (!tooltip) {
      return;
    }

    tooltip.classList.remove('company-tooltip--visible');
    tooltip.classList.remove('company-tooltip--above');
    tooltip.setAttribute('aria-hidden', 'true');
    element.removeAttribute('aria-describedby');
    this.activeEl = null;

    if (this.positionFrame !== null) {
      cancelAnimationFrame(this.positionFrame);
      this.positionFrame = null;
    }
  }

  private schedulePosition(immediate = false): void {
    if (!this.activeEl || !this.tooltipEl) {
      return;
    }

    if (this.positionFrame !== null) {
      cancelAnimationFrame(this.positionFrame);
      this.positionFrame = null;
    }

    if (immediate) {
      this.updatePosition();
      return;
    }

    this.positionFrame = requestAnimationFrame(() => {
      this.positionFrame = null;
      this.updatePosition();
    });
  }

  private updatePosition(): void {
    if (!this.activeEl || !this.tooltipEl) {
      return;
    }

    const tooltip = this.tooltipEl;
    const targetRect = this.activeEl.getBoundingClientRect();

    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const halfWidth = tooltipWidth / 2;
    const clampedCenterX = clamp(
      targetRect.left + targetRect.width / 2,
      TOOLTIP_MARGIN + halfWidth,
      viewportWidth - TOOLTIP_MARGIN - halfWidth
    );

    let top = targetRect.bottom + TOOLTIP_MARGIN;
    let placeAbove = false;

    if (
      top + tooltipHeight > viewportHeight - TOOLTIP_MARGIN &&
      targetRect.top > tooltipHeight + TOOLTIP_MARGIN
    ) {
      top = targetRect.top - TOOLTIP_MARGIN - tooltipHeight;
      placeAbove = true;
    }

    tooltip.style.left = `${Math.round(clampedCenterX)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
    tooltip.classList.toggle('company-tooltip--above', placeAbove);
  }
}
