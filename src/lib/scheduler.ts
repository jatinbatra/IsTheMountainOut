/**
 * Scheduler utilities for background data refresh
 * Used to keep visibility scores updated without user interaction
 */

/**
 * Scheduler configuration
 */
export const SCHEDULER_CONFIG = {
  // Refresh intervals (milliseconds)
  WEATHER_REFRESH: 15 * 60 * 1000, // 15 minutes
  FORECAST_REFRESH: 30 * 60 * 1000, // 30 minutes
  ANALYTICS_FLUSH: 60 * 1000, // 1 minute
  CACHE_INVALIDATE: 24 * 60 * 60 * 1000, // 24 hours

  // Background task limits
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
  REQUEST_TIMEOUT: 30000, // 30 seconds
};

/**
 * Setup interval-based data refresh
 */
export function setupDataRefresh(
  callback: () => Promise<void>,
  intervalMs: number = SCHEDULER_CONFIG.WEATHER_REFRESH
): () => void {
  // Initial fetch
  callback().catch(console.error);

  // Set up recurring refresh
  const intervalId = setInterval(() => {
    callback().catch(console.error);
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Exponential backoff for failed requests
 */
export function getBackoffDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = SCHEDULER_CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = getBackoffDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Service Worker periodic background sync
 * Registers a background sync tag for periodic updates
 */
export async function registerPeriodicSync(tag: string): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  if (!("periodicSync" in ServiceWorkerRegistration.prototype)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const syncRegistration = registration as unknown as {
      periodicSync?: {
        register: (tag: string, options: { minInterval: number }) => Promise<void>;
      };
    };

    if (syncRegistration.periodicSync) {
      await syncRegistration.periodicSync.register(tag, {
        minInterval: SCHEDULER_CONFIG.WEATHER_REFRESH,
      });
    }
  } catch (error) {
    console.warn("Periodic sync not supported:", error);
  }
}

/**
 * Check if app is online
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

/**
 * Setup online/offline listeners
 */
export function setupConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

/**
 * Detect if user is idle (for reducing refresh frequency)
 */
export function setupIdleDetector(
  onActive: () => void,
  onIdle: () => void,
  idleThresholdMs: number = 5 * 60 * 1000
): () => void {
  if (typeof window === "undefined") return () => {};

  let idleTimer: ReturnType<typeof setTimeout>;
  let isIdle = false;

  const resetIdleTimer = () => {
    clearTimeout(idleTimer);

    if (isIdle) {
      onActive();
      isIdle = false;
    }

    idleTimer = setTimeout(() => {
      onIdle();
      isIdle = true;
    }, idleThresholdMs);
  };

  // Events that indicate user activity
  const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
  events.forEach((event) => window.addEventListener(event, resetIdleTimer));

  // Initial idle timer
  resetIdleTimer();

  // Cleanup
  return () => {
    clearTimeout(idleTimer);
    events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
  };
}
