/**
 * DOM utility functions
 */

export const $ = <T extends Element = Element>(
  sel: string,
  root: Document | Element = document
): T | null => root.querySelector<T>(sel);

export const $$ = <T extends Element = Element>(
  sel: string,
  root: Document | Element = document
): T[] => Array.from(root.querySelectorAll<T>(sel));
