export interface DocData {
  section?: string;
  roleTitle?: string;
  bulletText?: string | null;
  template?: string;
}

export type AnimationState = 'open' | 'closed' | 'opening' | 'closing';
