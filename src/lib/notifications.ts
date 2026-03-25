/**
 * Push notification and service worker registration utilities.
 *
 * Usage in a component:
 *   import { registerSW, requestNotificationPermission, isNotificationsSupported } from "@/lib/notifications";
 *
 *   useEffect(() => { registerSW(); }, []);
 *
 *   const handleEnable = async () => {
 *     const granted = await requestNotificationPermission();
 *     if (granted) { ... subscribe to push ... }
 *   };
 */

/** Check if push notifications are supported in this browser */
export function isNotificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window &&
    "PushManager" in window
  );
}

/** Get current notification permission state */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationsSupported()) return "unsupported";
  return Notification.permission;
}

/** Register the service worker */
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("[SW] Registered:", registration.scope);
    return registration;
  } catch (err) {
    console.error("[SW] Registration failed:", err);
    return null;
  }
}

/** Request notification permission from the user */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;

  // Already granted
  if (Notification.permission === "granted") return true;

  // Already denied — can't re-ask
  if (Notification.permission === "denied") return false;

  // Ask the user
  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Subscribe to push notifications.
 *
 * In production, you'd send the subscription to your backend
 * so it can send push messages when visibility changes.
 *
 * @param registration - The active service worker registration
 * @param vapidPublicKey - Your VAPID public key (base64 encoded)
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  try {
    // Convert VAPID key
    const keyArray = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyArray as unknown as BufferSource,
    });

    console.log("[Push] Subscribed:", JSON.stringify(subscription));

    // TODO: Send subscription to your backend
    // await fetch("/api/push-subscribe", {
    //   method: "POST",
    //   body: JSON.stringify(subscription),
    //   headers: { "Content-Type": "application/json" },
    // });

    return subscription;
  } catch (err) {
    console.error("[Push] Subscription failed:", err);
    return null;
  }
}

/** Send a local test notification (for development) */
export function sendTestNotification(): void {
  if (Notification.permission !== "granted") return;

  new Notification("The Mountain is OUT!", {
    body: "Mt. Rainier is visible right now. Score: 85/100.",
    icon: "/icons/icon-192.png",
    tag: "mountain-test",
  });
}

/** Convert a base64 VAPID key to Uint8Array for PushManager */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}
