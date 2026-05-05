/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 * - Contrast ratios
 * - Keyboard navigation
 * - Screen reader support
 * - Focus management
 */

// WCAG AA minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
};

/**
 * Calculate relative luminance per WCAG formula
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((x) => {
    x = x / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (hex format)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const toRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [255, 255, 255];
  };

  const [r1, g1, b1] = toRgb(hex1);
  const [r2, g2, b2] = toRgb(hex2);

  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 */
export function meetsWCAG_AA(hex1: string, hex2: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(hex1, hex2);
  return ratio >= (isLargeText ? CONTRAST_RATIOS.AA_LARGE : CONTRAST_RATIOS.AA_NORMAL);
}

/**
 * Focus management utilities
 */
export function manageFocus(element: HTMLElement | null) {
  if (!element) return;
  // Restore focus after DOM updates
  element.focus();
  // Announce to screen readers via aria-live
  const ariaLive = document.querySelector("[aria-live='polite']");
  if (ariaLive) ariaLive.textContent = "Content updated";
}

/**
 * Create accessible skip link for keyboard navigation
 */
export function createSkipLink(): React.ReactNode {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-[var(--season-accent)] focus:text-white focus:px-4 focus:py-2 focus:rounded"
    >
      Skip to main content
    </a>
  );
}

/**
 * Keyboard navigation handler
 */
export function handleKeyNavigation(
  event: React.KeyboardEvent,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onEnter?: () => void,
  onEscape?: () => void
) {
  switch (event.key) {
    case "ArrowUp":
      event.preventDefault();
      onArrowUp?.();
      break;
    case "ArrowDown":
      event.preventDefault();
      onArrowDown?.();
      break;
    case "Enter":
      event.preventDefault();
      onEnter?.();
      break;
    case "Escape":
      event.preventDefault();
      onEscape?.();
      break;
  }
}
