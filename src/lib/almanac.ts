import { kv } from "@vercel/kv";
import { getGlobalStreak } from "@/lib/globalStreak";

type CalendarData = Record<string, { score: number; isVisible: boolean }>;

export interface StreakRun {
  type: "clear" | "gloom";
  days: number;
  start: string;
  end: string;
}

export interface MonthlyAverage {
  month: string;
  label: string;
  clearDays: number;
  totalDays: number;
  avgScore: number;
  clearRate: number;
}

export interface AlmanacStats {
  generatedAt: string;
  sinceDate: string;
  trackingDays: number;
  ytd: {
    year: number;
    clearDays: number;
    gloomDays: number;
    totalDays: number;
    clearRate: number;
    avgScore: number;
  };
  currentStreak: {
    type: "out" | "gloom";
    days: number;
    since: string;
  } | null;
  records: {
    longestClear: StreakRun | null;
    longestGloom: StreakRun | null;
    bestSingleDay: { date: string; score: number } | null;
    worstSingleDay: { date: string; score: number } | null;
  };
  monthly: MonthlyAverage[];
  pressQuotes: string[];
}

function sortedDates(data: CalendarData): string[] {
  return Object.keys(data).sort();
}

function computeStreaks(data: CalendarData): {
  longestClear: StreakRun | null;
  longestGloom: StreakRun | null;
} {
  const dates = sortedDates(data);
  let longestClear: StreakRun | null = null;
  let longestGloom: StreakRun | null = null;
  let runType: "clear" | "gloom" | null = null;
  let runStart: string | null = null;
  let runLen = 0;
  let runEnd: string | null = null;

  const closeRun = () => {
    if (!runType || !runStart || !runEnd || runLen === 0) return;
    const run: StreakRun = { type: runType, days: runLen, start: runStart, end: runEnd };
    if (runType === "clear" && (!longestClear || run.days > longestClear.days)) {
      longestClear = run;
    }
    if (runType === "gloom" && (!longestGloom || run.days > longestGloom.days)) {
      longestGloom = run;
    }
  };

  for (const date of dates) {
    const entry = data[date];
    const kind: "clear" | "gloom" = entry.isVisible ? "clear" : "gloom";
    if (kind === runType) {
      runLen += 1;
      runEnd = date;
    } else {
      closeRun();
      runType = kind;
      runStart = date;
      runEnd = date;
      runLen = 1;
    }
  }
  closeRun();

  return { longestClear, longestGloom };
}

function computeYtd(data: CalendarData, year: number) {
  const prefix = `${year}-`;
  let clear = 0;
  let gloom = 0;
  let totalScore = 0;
  let count = 0;
  let best: { date: string; score: number } | null = null;
  let worst: { date: string; score: number } | null = null;
  for (const [date, entry] of Object.entries(data)) {
    if (!date.startsWith(prefix)) continue;
    count += 1;
    totalScore += entry.score;
    if (entry.isVisible) clear += 1;
    else gloom += 1;
    if (!best || entry.score > best.score) best = { date, score: entry.score };
    if (!worst || entry.score < worst.score) worst = { date, score: entry.score };
  }
  return {
    clearDays: clear,
    gloomDays: gloom,
    totalDays: count,
    avgScore: count ? Math.round(totalScore / count) : 0,
    clearRate: count ? clear / count : 0,
    best,
    worst,
  };
}

function computeMonthly(data: CalendarData, limit = 12): MonthlyAverage[] {
  const buckets = new Map<string, { sum: number; clear: number; total: number }>();
  for (const [date, entry] of Object.entries(data)) {
    const month = date.slice(0, 7);
    const b = buckets.get(month) ?? { sum: 0, clear: 0, total: 0 };
    b.sum += entry.score;
    b.total += 1;
    if (entry.isVisible) b.clear += 1;
    buckets.set(month, b);
  }
  const rows = [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, limit)
    .map(([month, b]) => {
      const d = new Date(`${month}-01T00:00:00`);
      return {
        month,
        label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        clearDays: b.clear,
        totalDays: b.total,
        avgScore: Math.round(b.sum / b.total),
        clearRate: b.clear / b.total,
      } satisfies MonthlyAverage;
    });
  return rows;
}

function findSinceDate(data: CalendarData): string {
  const dates = sortedDates(data);
  return dates[0] ?? new Date().toISOString().split("T")[0];
}

function buildPressQuotes(stats: Omit<AlmanacStats, "pressQuotes">): string[] {
  const quotes: string[] = [];
  const year = stats.ytd.year;

  if (stats.ytd.totalDays > 0) {
    const pct = Math.round(stats.ytd.clearRate * 100);
    quotes.push(
      `Mt. Rainier has been visible from Seattle on ${stats.ytd.clearDays} of ${stats.ytd.totalDays} days in ${year} (${pct}%), per IsTheMountainOut.com.`
    );
  }

  if (stats.currentStreak && stats.currentStreak.days >= 3) {
    const word = stats.currentStreak.type === "out" ? "visible" : "hidden";
    quotes.push(
      `Mt. Rainier has been ${word} from Seattle for ${stats.currentStreak.days} straight days (since ${stats.currentStreak.since}), per IsTheMountainOut.com.`
    );
  }

  if (stats.records.longestGloom) {
    quotes.push(
      `The longest stretch of mountain-hidden days on record at IsTheMountainOut.com is ${stats.records.longestGloom.days} days (${stats.records.longestGloom.start} to ${stats.records.longestGloom.end}).`
    );
  }

  if (stats.records.longestClear) {
    quotes.push(
      `The longest run of clear mountain-visible days on record at IsTheMountainOut.com is ${stats.records.longestClear.days} days (${stats.records.longestClear.start} to ${stats.records.longestClear.end}).`
    );
  }

  return quotes;
}

export async function getAlmanacStats(): Promise<AlmanacStats> {
  let data: CalendarData = {};
  try {
    data = (await kv.get<CalendarData>("calendar:data")) || {};
  } catch (err) {
    console.warn("[Almanac] calendar fetch failed:", err);
  }

  const streak = await getGlobalStreak().catch(() => null);
  const { longestClear, longestGloom } = computeStreaks(data);

  const now = new Date();
  const year = now.getFullYear();
  const ytd = computeYtd(data, year);
  const monthly = computeMonthly(data);
  const sinceDate = findSinceDate(data);
  const trackingDays = Object.keys(data).length;

  const base: Omit<AlmanacStats, "pressQuotes"> = {
    generatedAt: now.toISOString(),
    sinceDate,
    trackingDays,
    ytd: {
      year,
      clearDays: ytd.clearDays,
      gloomDays: ytd.gloomDays,
      totalDays: ytd.totalDays,
      avgScore: ytd.avgScore,
      clearRate: ytd.clearRate,
    },
    currentStreak:
      streak && streak.days > 0
        ? { type: streak.type, days: streak.days, since: streak.since }
        : null,
    records: {
      longestClear,
      longestGloom,
      bestSingleDay: ytd.best,
      worstSingleDay: ytd.worst,
    },
    monthly,
  };

  return { ...base, pressQuotes: buildPressQuotes(base) };
}
