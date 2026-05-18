/**
 * Animation utilities and keyframes for mountain reveal
 * - Smooth score transitions
 * - Staggered component reveals
 * - Parallax and scroll effects
 */

/**
 * Get animation delay based on index for staggered reveals
 */
export function getStaggerDelay(index: number, baseDelay = 80): number {
  return index * baseDelay;
}

/**
 * Calculate mountain height animation
 * Maps score (0-100) to SVG path height
 */
export function getMountainHeight(score: number): number {
  return Math.max(20, (score / 100) * 100);
}

/**
 * Smooth easing functions for animations
 */
export const EASING = {
  // Cubic bezier easing (matches CSS custom property: --ease-out-expo)
  outExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
  inOutQuad: "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
  easeInOutCubic: "cubic-bezier(0.645, 0.045, 0.355, 1)",
  easeOutQuad: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  easeOutQuint: "cubic-bezier(0.23, 1, 0.320, 1)",
};

/**
 * Transition duration constants (ms)
 */
export const DURATIONS = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 1000,
  mountainReveal: 1200,
};

/**
 * Calculate parallax offset based on scroll position
 * Slower movement for background elements
 */
export function getParallaxOffset(scrollY: number, factor = 0.5): number {
  return scrollY * factor;
}

/**
 * Create staggered animation CSS variables
 */
export function createStaggerVariables(count: number, baseDelay = 80): Record<string, string> {
  const vars: Record<string, string> = {};
  for (let i = 1; i <= count; i++) {
    vars[`--stagger-${i}`] = `${i * baseDelay}ms`;
  }
  return vars;
}

/**
 * Intersection Observer callback for scroll reveal animations
 */
export function createScrollRevealCallback(
  onIntersect: (isIntersecting: boolean) => void
): IntersectionObserverCallback {
  return (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        onIntersect(true);
      }
    });
  };
}

/**
 * Animate score transition with smooth easing
 */
export function animateScoreTransition(
  startScore: number,
  endScore: number,
  duration: number = DURATIONS.mountainReveal,
  callback: (score: number) => void
): () => void {
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function: cubic-bezier(0.16, 1, 0.3, 1) approximation
    const eased =
      progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;

    const currentScore = startScore + (endScore - startScore) * eased;
    callback(Math.round(currentScore));

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);

  // Return cleanup function
  return () => {
    // Cancel any remaining animation
  };
}

/**
 * Generate CSS for fade-up animation on page load
 */
export function getFadeUpStyle(index: number, baseDelay = 80): React.CSSProperties {
  return {
    animation: `fade-up 0.5s var(--ease-out-expo) forwards`,
    animationDelay: `${getStaggerDelay(index, baseDelay)}ms`,
    opacity: 0,
  };
}

/**
 * Generate CSS for fade-in animation
 */
export function getFadeInStyle(delay = 0): React.CSSProperties {
  return {
    animation: `fade-in 0.4s ease-out forwards`,
    animationDelay: `${delay}ms`,
    opacity: 0,
  };
}

/**
 * Check if reduced motion preference is set
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get animation duration respecting user preferences
 */
export function getRespectfulDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}
