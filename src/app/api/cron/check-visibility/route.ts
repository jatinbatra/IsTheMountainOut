import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import webpush from "web-push";
import { fetchWeatherData } from "@/lib/weather";
import { calculateVisibility, VISIBLE_THRESHOLD } from "@/lib/visibility";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? "mailto:hello@isthemountainout.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
    process.env.VAPID_PRIVATE_KEY || ""
  );

  try {
    // 1. Fetch current visibility
    const weather = await fetchWeatherData({ noCache: true });
    const visibility = calculateVisibility(weather);
    const isOut = visibility.score >= VISIBLE_THRESHOLD;

    // 2. Get previous state
    const prevState = await kv.get<boolean>("mountain:isOut");
    
    // 3. If state changed to "Out", send notifications
    if (isOut && !prevState) {
      const subscriptions = await kv.hgetall<Record<string, string>>("push:subscriptions");
      
      if (subscriptions) {
        const payloads = Object.values(subscriptions).map(subStr => {
          const subscription = JSON.parse(subStr);
          return webpush.sendNotification(
            subscription,
            JSON.stringify({
              title: "The Mountain is Out! 🏔️",
              body: `Visibility is ${visibility.score}/100 right now. Clear views expected for the next few hours.`,
              url: "https://is-the-mountain-out.vercel.app"
            })
          ).catch(err => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              // Remove expired subscriptions
              kv.hdel("push:subscriptions", subscription.endpoint);
            }
          });
        });

        await Promise.all(payloads);
      }
    }

    // 4. Update state in KV
    await kv.set("mountain:isOut", isOut);

    return NextResponse.json({ 
      ok: true, 
      isOut, 
      notified: isOut && !prevState 
    });
  } catch (err) {
    console.error("[Cron] Visibility check failed:", err);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
