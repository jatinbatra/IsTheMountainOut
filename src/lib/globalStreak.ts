import { kv } from "@vercel/kv";

export type StreakType = "out" | "gloom";

export interface GlobalStreak {
  type: StreakType;
  days: number;
  since: string;
  lastDate: string;
}

const KEY = "global:streak";

function todayPT(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}

export async function getGlobalStreak(): Promise<GlobalStreak | null> {
  try {
    return await kv.get<GlobalStreak>(KEY);
  } catch {
    return null;
  }
}

export async function recordGlobalStreak(isVisible: boolean): Promise<GlobalStreak> {
  const today = todayPT();
  const type: StreakType = isVisible ? "out" : "gloom";

  let current: GlobalStreak | null = null;
  try {
    current = await kv.get<GlobalStreak>(KEY);
  } catch {
    // ignore
  }

  let next: GlobalStreak;

  if (!current) {
    next = { type, days: 1, since: today, lastDate: today };
  } else if (current.lastDate === today) {
    if (current.type === type) {
      next = current;
    } else {
      next = { type, days: 1, since: today, lastDate: today };
    }
  } else if (current.type === type) {
    next = { ...current, days: current.days + 1, lastDate: today };
  } else {
    next = { type, days: 1, since: today, lastDate: today };
  }

  try {
    await kv.set(KEY, next);
  } catch {
    // non-critical
  }

  return next;
}
