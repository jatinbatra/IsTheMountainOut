import { computeCurrentStreak, getCalendar, ptDay, isStorageConfigured } from "@/lib/history";

export type StreakType = "out" | "gloom";

export interface GlobalStreak {
  type: StreakType;
  days: number;
  since: string;
  lastDate: string;
}

/**
 * Current city-wide out/gloom streak, derived from the daily mountain log.
 * (Previously this was a separately-incremented counter that reset itself
 * every night, because night readings always count as "not visible".)
 */
export async function getGlobalStreak(): Promise<GlobalStreak | null> {
  if (!isStorageConfigured()) return null;
  try {
    const today = ptDay();
    const streak = computeCurrentStreak(await getCalendar(), today);
    return streak ? { ...streak, lastDate: today } : null;
  } catch {
    return null;
  }
}
