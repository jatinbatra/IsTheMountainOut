/**
 * Performance optimization utilities
 * - Request debouncing/throttling
 * - Image optimization helpers
 * - Cache invalidation
 * - Lazy loading
 */

/**
 * Debounce function to prevent excessive function calls
 * Used for resize, scroll, search input handlers
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function execution frequency
 * Used for scroll events, mouse move handlers
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Web Vitals tracking for performance monitoring
 */
export interface WebVitals {
  metric: "LCP" | "FID" | "CLS" | "TTFB";
  value: number;
  id: string;
  navigationType: string;
}

/**
 * Report Web Vitals to analytics endpoint
 */
export function reportWebVitals(metric: WebVitals) {
  // Only send in production
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") {
    return;
  }

  const body = JSON.stringify(metric);
  // Use sendBeacon to ensure it sends even if page unloads
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", body);
  } else {
    fetch("/api/analytics", { body, method: "POST", keepalive: true });
  }
}

/**
 * Image optimization helper for responsive images
 */
export function getImageSrcSet(baseUrl: string): string {
  // Assumes image service supports width parameter
  return [
    `${baseUrl}?w=320 320w`,
    `${baseUrl}?w=640 640w`,
    `${baseUrl}?w=1280 1280w`,
    `${baseUrl}?w=1920 1920w`,
  ].join(", ");
}

/**
 * Cache key generator for SWR and fetch
 */
export function getCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  if (!params) return endpoint;
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  );
  return `${endpoint}?${query.toString()}`;
}

/**
 * Prefetch DNS for external APIs
 */
export const PREFETCH_LINKS = [
  { rel: "dns-prefetch", href: "https://api.open-meteo.com" },
  { rel: "dns-prefetch", href: "https://air-quality-api.open-meteo.com" },
  { rel: "preconnect", href: "https://cdn.example.com" },
];

/**
 * Helper to measure component render time
 */
export function measureRender(componentName: string, callback: () => void) {
  if (typeof window === "undefined" || !window.performance) return callback();

  const startMark = `${componentName}-start`;
  const endMark = `${componentName}-end`;
  const measureName = `${componentName}-duration`;

  performance.mark(startMark);
  callback();
  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);

  const measure = performance.getEntriesByName(measureName)[0];
  if (measure && process.env.NODE_ENV === "development") {
    console.log(`⏱️  ${componentName}: ${measure.duration.toFixed(2)}ms`);
  }
}
