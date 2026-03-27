import { NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather";
import { calculateVisibility } from "@/lib/visibility";
import {
  getMountainState,
  saveMountainState,
  evaluateTransition,
  buildNewState,
} from "@/lib/state";
import { postTweet } from "@/lib/channels/twitter";
import { sendPushToAll } from "@/lib/channels/push";
import { sendAlertEmails } from "@/lib/channels/email";

/**
 * Cron evaluation endpoint.
 * Hit every 15 minutes by external cron (cron-job.org) or Vercel Cron.
 *
 * Validates via Authorization header or query param.
 */
export async function GET(request: Request) {
  // Validate cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const querySecret = searchParams.get("secret");

  const providedSecret = authHeader?.replace("Bearer ", "") || querySecret;

  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch fresh weather data (no cache)
    const weather = await fetchWeatherData({ noCache: true });

    // 2. Calculate visibility
    const visibility = calculateVisibility(weather);

    // 3. Load previous state
    const previousState = await getMountainState();

    // 4. Evaluate transitions
    const transition = await evaluateTransition(
      visibility.score,
      visibility.isVisible,
      weather.sunset,
      previousState
    );

    // 5. Save new state
    const newState = buildNewState(visibility.score, visibility.isVisible, previousState);
    await saveMountainState(newState);

    // 6. Dispatch notifications if needed
    const results: Record<string, unknown> = {};

    if (transition.shouldNotify) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://isthemountainout.com";
      const title = transition.type === "mountain_emerged"
        ? "The Mountain is OUT!"
        : "Prime Sunset Viewing";

      // Fire all channels in parallel
      const [tweetResult, pushResult, emailResult] = await Promise.allSettled([
        postTweet(transition.message + ` ${siteUrl}`),
        sendPushToAll(title, transition.message),
        sendAlertEmails(title, transition.message, siteUrl),
      ]);

      results.twitter = tweetResult.status === "fulfilled" ? tweetResult.value : "failed";
      results.push = pushResult.status === "fulfilled" ? pushResult.value : "failed";
      results.email = emailResult.status === "fulfilled" ? emailResult.value : "failed";
    }

    return NextResponse.json({
      score: visibility.score,
      isVisible: visibility.isVisible,
      transition: transition.type,
      notified: transition.shouldNotify,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Cron] Evaluation failed:", err);
    return NextResponse.json(
      { error: "Evaluation failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
