import { kv } from "@vercel/kv";
import {
  NEIGHBORHOOD_LABELS,
  getAllNeighborhoodScores,
} from "@/lib/visibility";

const HISTORY_KEY = "hood:history";
const WINDOW_DAYS = 30;
const VISIBLE_THRESHOLD = 50;

type HoodHistory = Record<string, Record<string, number>>;

export interface HoodStanding {
  id: string;
  label: string;
  outDays: number;
  currentStreak: number;
  longestStreak: number;
  todayScore: number;
  avgScore: number;
}

function todayKey(): string {
  const d = new Date();
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }));
  }
  return days;
}

export async function snapshotHoodScores(
  baseScore: number,
  humidity: number,
): Promise<void> {
  try {
    const scores = getAllNeighborhoodScores(baseScore, humidity);
    const existing = ((await kv.get<HoodHistory>(HISTORY_KEY)) || {}) as HoodHistory;
    const today = todayKey();
    const cutoff = lastNDays(WINDOW_DAYS + 5).at(-1)!;

    for (const { id, score } of scores) {
      const hist = existing[id] || {};
      hist[today] = score;
      for (const date of Object.keys(hist)) {
        if (date < cutoff) delete hist[date];
      }
      existing[id] = hist;
    }

    await kv.set(HISTORY_KEY, existing);
  } catch (err) {
    console.warn("[Hoods] snapshot failed:", err);
  }
}

export async function getHoodStandings(): Promise<HoodStanding[]> {
  let history: HoodHistory = {};
  try {
    history = ((await kv.get<HoodHistory>(HISTORY_KEY)) || {}) as HoodHistory;
  } catch {
    history = {};
  }

  const window = lastNDays(WINDOW_DAYS);
  const today = window[0];

  const standings: HoodStanding[] = Object.keys(NEIGHBORHOOD_LABELS).map((id) => {
    const hist = history[id] || {};
    let outDays = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let runningStreak = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    for (let i = 0; i < window.length; i++) {
      const date = window[i];
      const score = hist[date];
      if (typeof score === "number") {
        scoreSum += score;
        scoreCount += 1;
        const wasVisible = score >= VISIBLE_THRESHOLD;
        if (wasVisible) {
          outDays += 1;
          runningStreak += 1;
          if (runningStreak > longestStreak) longestStreak = runningStreak;
          if (i === currentStreak) currentStreak = runningStreak;
        } else {
          if (i === 0) currentStreak = 0;
          runningStreak = 0;
        }
      } else {
        runningStreak = 0;
      }
    }

    const todayScore = hist[today] ?? 0;
    const avgScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;

    return {
      id,
      label: NEIGHBORHOOD_LABELS[id],
      outDays,
      currentStreak,
      longestStreak,
      todayScore,
      avgScore,
    };
  });

  standings.sort((a, b) => {
    if (b.outDays !== a.outDays) return b.outDays - a.outDays;
    if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
    return b.todayScore - a.todayScore;
  });

  return standings;
}

export async function getHoodStanding(id: string): Promise<HoodStanding | null> {
  const all = await getHoodStandings();
  return all.find((h) => h.id === id) ?? null;
}

export { WINDOW_DAYS, VISIBLE_THRESHOLD };
