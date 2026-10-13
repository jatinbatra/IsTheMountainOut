import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {
  computeCurrentStreak,
  getCalendar,
  getDayObservations,
  getRecentEvents,
  isStorageConfigured,
  ptDay,
  shiftDay,
  type MountainEvent,
  type MountainState,
  type Observation,
  type StreakInfo,
} from "@/lib/history";
import { getSpotterCount } from "@/lib/spotters";

export const dynamic = "force-dynamic";

export interface HistoryResponse {
  storage: "ok" | "unconfigured" | "error";
  generatedAt: string;
  current: Observation | null;
  last24h: { ts: string; slot: string; score: number; state: MountainState }[];
  events: MountainEvent[];
  days: { date: string; score: number; isVisible: boolean; outHours: number; observed: boolean }[];
  stats: {
    trackingSince: string | null;
    daysTracked: number;
    outDays30: number;
    observedDays30: number;
    clearRate30: number | null;
    avgPeak30: number | null;
    outHoursToday: number;
    lastSeenOut: string | null;
    streak: StreakInfo | null;
  };
  analytics: {
    viewsToday: number;
    views7d: { date: string; views: number }[];
    spottersNow: number;
  };
}

function empty(storage: HistoryResponse["storage"]): HistoryResponse {
  return {
    storage,
    generatedAt: new Date().toISOString(),
    current: null,
    last24h: [],
    events: [],
    days: [],
    stats: {
      trackingSince: null,
      daysTracked: 0,
      outDays30: 0,
      observedDays30: 0,
      clearRate30: null,
      avgPeak30: null,
      outHoursToday: 0,
      lastSeenOut: null,
      streak: null,
    },
    analytics: { viewsToday: 0, views7d: [], spottersNow: 0 },
  };
}

const HEADERS = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" };

export async function GET() {
  if (!isStorageConfigured()) {
    return NextResponse.json(empty("unconfigured"), { headers: HEADERS });
  }

  try {
    const today = ptDay();
    const yesterday = shiftDay(today, -1);
    const last7 = Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));

    const [calendar, todayObs, yesterdayObs, events, current, spottersNow, viewCounts] =
      await Promise.all([
        getCalendar(),
        getDayObservations(today),
        getDayObservations(yesterday),
        getRecentEvents(15),
        kv.get<Observation>("obs:last").catch(() => null),
        getSpotterCount().catch(() => 0),
        Promise.all(last7.map((d) => kv.get<number>(`beacon:views:${d}`).catch(() => 0))),
      ]);

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const last24h = [...yesterdayObs, ...todayObs]
      .filter((o) => new Date(o.ts).getTime() >= cutoff)
      .map(({ ts, slot, score, state }) => ({ ts, slot, score, state }));

    const days = Array.from({ length: 30 }, (_, i) => {
      const date = shiftDay(today, i - 29);
      const d = calendar[date];
      const observed = Boolean(d && d.score >= 0);
      return {
        date,
        score: observed ? d.score : -1,
        isVisible: observed ? d.isVisible : false,
        outHours: Math.round(((d?.outSlots ?? 0) / 4) * 10) / 10,
        observed,
      };
    });

    const observedDays = days.filter((d) => d.observed);
    const outDays = observedDays.filter((d) => d.isVisible);
    const lastSeenOut =
      Object.keys(calendar)
        .sort()
        .reverse()
        .map((k) => calendar[k].lastOut)
        .find(Boolean) ?? null;
    const trackedKeys = Object.keys(calendar).filter((k) => calendar[k].score >= 0).sort();

    const body: HistoryResponse = {
      storage: "ok",
      generatedAt: new Date().toISOString(),
      current: current ?? null,
      last24h,
      events,
      days,
      stats: {
        trackingSince: trackedKeys[0] ?? null,
        daysTracked: trackedKeys.length,
        outDays30: outDays.length,
        observedDays30: observedDays.length,
        clearRate30: observedDays.length
          ? Math.round((outDays.length / observedDays.length) * 100)
          : null,
        avgPeak30: observedDays.length
          ? Math.round(observedDays.reduce((s, d) => s + d.score, 0) / observedDays.length)
          : null,
        outHoursToday: Math.round(((calendar[today]?.outSlots ?? 0) / 4) * 10) / 10,
        lastSeenOut,
        streak: computeCurrentStreak(calendar, today),
      },
      analytics: {
        viewsToday: Number(viewCounts[6] ?? 0),
        views7d: last7.map((date, i) => ({ date, views: Number(viewCounts[i] ?? 0) })),
        spottersNow,
      },
    };

    return NextResponse.json(body, { headers: HEADERS });
  } catch (err) {
    console.error("[history] read failed:", err);
    return NextResponse.json(empty("error"), { headers: HEADERS });
  }
}
