import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import webpush from "web-push";
import { fetchWeatherData } from "@/lib/weather";
import {
  calculateVisibility,
  scoreHourForTimeline,
  scoreDailyForecast,
} from "@/lib/visibility";
import {
  getMountainState,
  saveMountainState,
  evaluateTransition,
  buildNewState,
} from "@/lib/state";
import { snapshotHoodScores } from "@/lib/hoods";
import { settleWeekIfDue, recordDailyActual } from "@/lib/pool";
import { recordGlobalStreak, getGlobalStreak } from "@/lib/globalStreak";

type CalendarData = Record<string, { score: number; isVisible: boolean }>;

async function saveCalendarSnapshot(score: number, isVisible: boolean) {
  const today = new Date().toISOString().split("T")[0];
  try {
    const data = (await kv.get<CalendarData>("calendar:data")) || {};
    data[today] = { score, isVisible };

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 35);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    for (const key of Object.keys(data)) {
      if (key < cutoffStr) delete data[key];
    }

    await kv.set("calendar:data", data);
  } catch (err) {
    console.warn("[Cron] Calendar snapshot failed:", err);
  }
}

async function sendPushToAll(title: string, body: string) {
  const vapidEmail = process.env.VAPID_EMAIL;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!vapidEmail || !vapidPublic || !vapidPrivate) return;

  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);

  try {
    const subs = await kv.hgetall<Record<string, string>>("push:subscriptions");
    if (!subs) return;

    const payload = JSON.stringify({ title, body });

    for (const [endpoint, subJson] of Object.entries(subs)) {
      try {
        const subscription = JSON.parse(subJson);
        await webpush.sendNotification(subscription, payload);
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await kv.hdel("push:subscriptions", endpoint);
        }
      }
    }
  } catch (err) {
    console.warn("[Push] Broadcast failed:", err);
  }
}

export async function GET(request: Request) {
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
    const weather = await fetchWeatherData({ noCache: true });
    const visibility = calculateVisibility(weather);
    const previousState = await getMountainState();

    const hourlyScored = weather.hourlyForecast.map((h) => ({
      time: h.time,
      score: scoreHourForTimeline(h).score,
    }));
    const dailyScored = weather.dailyForecast.map((d) => ({
      date: d.date,
      dayLabel: d.dayLabel,
      score: scoreDailyForecast(d).score,
    }));
    const streak = await getGlobalStreak();
    const gloomStreakDays = streak?.type === "gloom" ? streak.days : 0;

    const transition = await evaluateTransition(
      visibility.score,
      visibility.isVisible,
      weather.sunset,
      previousState,
      {
        cloudLow: weather.currentCloudLow,
        cloudMid: weather.currentCloudMid,
        cloudHigh: weather.currentCloudHigh,
      },
      { hourlyScored, dailyScored, gloomStreakDays }
    );

    const newState = buildNewState(visibility.score, visibility.isVisible, previousState);
    await saveMountainState(newState);

    await saveCalendarSnapshot(visibility.score, visibility.isVisible);
    await snapshotHoodScores(visibility.score, weather.humidity);
    await recordDailyActual(visibility.score);
    await settleWeekIfDue();
    await recordGlobalStreak(visibility.isVisible);

    if (transition.shouldNotify) {
      const titles: Record<string, string> = {
        alpenglow_alert: "Alpenglow incoming",
        record_visibility: "Rare clarity — look up",
        mountain_emerged: "The Mountain is OUT",
        gloom_breaker: "The gloom just broke",
        sunset_prime: "Prime sunset tonight",
        morning_brief: "Morning brief",
        weekend_lookahead: "Weekend look-ahead",
        golden_hour: "Golden hour — get outside",
      };
      const title = titles[transition.type] ?? "Is The Mountain Out?";
      await sendPushToAll(title, transition.message);
    }

    return NextResponse.json({
      score: visibility.score,
      isVisible: visibility.isVisible,
      transition: transition.type,
      shouldNotify: transition.shouldNotify,
      message: transition.message,
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
