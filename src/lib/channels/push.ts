import { kv } from "@vercel/kv";
import webpush from "web-push";

const SUBSCRIPTIONS_KEY = "push:subscriptions";

/**
 * Configure VAPID keys for web push.
 */
function configureVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;

  if (!publicKey || !privateKey || !email) {
    return false;
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  return true;
}

/**
 * Store a push subscription.
 */
export async function addPushSubscription(subscription: PushSubscriptionJSON): Promise<void> {
  const endpoint = subscription.endpoint;
  if (!endpoint) throw new Error("Missing endpoint in subscription");
  await kv.hset(SUBSCRIPTIONS_KEY, { [endpoint]: JSON.stringify(subscription) });
}

/**
 * Remove a push subscription.
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  await kv.hdel(SUBSCRIPTIONS_KEY, endpoint);
}

/**
 * Get subscription count.
 */
export async function getPushSubscriptionCount(): Promise<number> {
  try {
    return await kv.hlen(SUBSCRIPTIONS_KEY);
  } catch {
    return 0;
  }
}

/**
 * Send push notification to all subscribers.
 */
export async function sendPushToAll(
  title: string,
  body: string
): Promise<{ sent: number; failed: number; removed: number }> {
  if (!configureVapid()) {
    console.warn("[Push] VAPID keys not configured, skipping push");
    return { sent: 0, failed: 0, removed: 0 };
  }

  let allSubs: Record<string, string>;
  try {
    allSubs = (await kv.hgetall(SUBSCRIPTIONS_KEY)) ?? {};
  } catch {
    console.warn("[Push] Failed to read subscriptions from KV");
    return { sent: 0, failed: 0, removed: 0 };
  }

  const endpoints = Object.keys(allSubs);
  if (endpoints.length === 0) return { sent: 0, failed: 0, removed: 0 };

  const payload = JSON.stringify({ title, body });
  let sent = 0;
  let failed = 0;
  let removed = 0;

  // Send with concurrency limit
  const BATCH_SIZE = 20;
  for (let i = 0; i < endpoints.length; i += BATCH_SIZE) {
    const batch = endpoints.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (endpoint) => {
        const subJson = allSubs[endpoint];
        const subscription = typeof subJson === "string" ? JSON.parse(subJson) : subJson;
        try {
          await webpush.sendNotification(subscription, payload);
          sent++;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            // Subscription expired, remove it
            await removePushSubscription(endpoint);
            removed++;
          } else {
            failed++;
          }
        }
      })
    );
    // allSettled doesn't throw, results are just for tracking
    void results;
  }

  console.log(`[Push] Sent ${sent}, failed ${failed}, removed ${removed} expired of ${endpoints.length}`);
  return { sent, failed, removed };
}
