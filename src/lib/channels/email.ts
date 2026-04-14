import { kv } from "@vercel/kv";
import { Resend } from "resend";

const SUBSCRIBERS_KEY = "email:subscribers";

/**
 * Add an email subscriber.
 */
export async function addEmailSubscriber(email: string): Promise<void> {
  await kv.sadd(SUBSCRIBERS_KEY, email);
}

/**
 * Remove an email subscriber.
 */
export async function removeEmailSubscriber(email: string): Promise<void> {
  await kv.srem(SUBSCRIBERS_KEY, email);
}

/**
 * Get subscriber count.
 */
export async function getEmailSubscriberCount(): Promise<number> {
  try {
    return await kv.scard(SUBSCRIBERS_KEY);
  } catch {
    return 0;
  }
}

/**
 * Send alert emails to all subscribers.
 */
export async function sendAlertEmails(
  subject: string,
  body: string,
  siteUrl: string
): Promise<{ sent: number; failed: number }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set, skipping email alerts");
    return { sent: 0, failed: 0 };
  }

  const resend = new Resend(apiKey);
  let subscribers: string[];

  try {
    subscribers = await kv.smembers(SUBSCRIBERS_KEY);
  } catch {
    console.warn("[Email] Failed to read subscribers from KV");
    return { sent: 0, failed: 0 };
  }

  if (subscribers.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  // Send in batches of 10
  for (let i = 0; i < subscribers.length; i += 10) {
    const batch = subscribers.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map((email) =>
        resend.emails.send({
          from: "Mt. Rainier Alerts <alerts@isthemountainout.com>",
          to: email,
          subject,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0e1a; color: #e2e8f0;">
              <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px 0; color: #ffffff;">${subject}</h1>
              <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">${body}</p>
              <a href="${siteUrl}" style="display: inline-block; padding: 12px 24px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; border: 1px solid rgba(59, 130, 246, 0.25);">Check the View</a>
              <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 32px 0 16px;" />
              <p style="font-size: 11px; color: rgba(255,255,255,0.2);">
                <a href="${siteUrl}/api/unsubscribe?type=email&value=${encodeURIComponent(email)}" style="color: rgba(255,255,255,0.25); text-decoration: underline;">Unsubscribe</a>
              </p>
            </div>
          `,
        })
      )
    );

    for (const r of results) {
      if (r.status === "fulfilled") sent++;
      else failed++;
    }
  }

  console.log(`[Email] Sent ${sent}, failed ${failed} of ${subscribers.length} subscribers`);
  return { sent, failed };
}
