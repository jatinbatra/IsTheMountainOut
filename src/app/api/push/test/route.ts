import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import webpush from "web-push";

export async function POST(req: NextRequest) {
  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const endpoint = String(body.endpoint || "");
  if (!endpoint) return NextResponse.json({ error: "missing_endpoint" }, { status: 400 });

  const vapidEmail = process.env.VAPID_EMAIL;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidEmail || !vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "push_not_configured" }, { status: 503 });
  }

  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);

  let subJson: string | null = null;
  try {
    subJson = await kv.hget<string>("push:subscriptions", endpoint);
  } catch {
    return NextResponse.json({ error: "subscription_lookup_failed" }, { status: 503 });
  }
  if (!subJson) {
    return NextResponse.json({ error: "subscription_not_found" }, { status: 404 });
  }

  try {
    const subscription = typeof subJson === "string" ? JSON.parse(subJson) : subJson;
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "Alerts are on",
        body: "This is a test ping from isthemountainout.com. You're all set.",
      }),
    );
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 410 || statusCode === 404) {
      try {
        await kv.hdel("push:subscriptions", endpoint);
      } catch {
        /* ignore */
      }
      return NextResponse.json({ error: "subscription_expired" }, { status: 410 });
    }
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
