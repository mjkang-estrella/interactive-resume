export interface DocData {
  section?: string;
  roleTitle?: string;
  bulletText?: string | null;
  url?: string;
  template?: string;
}

export interface AnimationKeyframe {
  opacity?: number;
  transform?: string;
}

export type AnimationState = 'open' | 'closed' | 'opening' | 'closing';

export interface DOMElements {
  page: HTMLElement;
  deck: HTMLElement;
  doc: HTMLElement;
  docContent: HTMLElement;
  paper: HTMLElement;
  sub: HTMLElement | null;
  title: HTMLElement | null;
  closeBtn: HTMLElement | null;
  toast: HTMLElement | null;
}
