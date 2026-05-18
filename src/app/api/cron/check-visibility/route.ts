import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import webpush from "web-push";
import { fetchWeatherData } from "@/lib/weather";
import { calculateVisibility } from "@/lib/visibility";

export async function GET(request: Request) {
  // Configure Web Push inside the request handler
  webpush.setVapidDetails(
    "mailto:jatinbatra1@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
    process.env.VAPID_PRIVATE_KEY || ""
  );

  // Verify Cron secret if needed (optional for this demo, but good practice)
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. Fetch current visibility
    const weather = await fetchWeatherData({ noCache: true });
    const visibility = calculateVisibility(weather);
    const isOut = visibility.score >= 50;

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
