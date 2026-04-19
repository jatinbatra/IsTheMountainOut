import { kv } from "@vercel/kv";

const TZ = "America/Los_Angeles";

export interface Guess {
  userId: string;
  handle: string;
  guess: number;
  submittedAt: string;
}

export interface DayGuess {
  date: string; // YYYY-MM-DD PT
  revealHour: number; // PT hour when reveal happens (default 20 = 8pm)
  isRevealed: boolean;
  actualPeak: number | null;
  myGuess: Guess | null;
  myError: number | null;
  totalPlays: number;
  averageGuess: number | null;
  top: { handle: string; error: number; guess: number }[];
}

const REVEAL_HOUR_PT = 20;

export function datePT(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function hourPT(d: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: TZ,
  }).formatToParts(d);
  return parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
}

export function isRevealed(date: string, now: Date = new Date()): boolean {
  const today = datePT(now);
  if (date < today) return true;
  if (date > today) return false;
  return hourPT(now) >= REVEAL_HOUR_PT;
}

const GUESSES_KEY = (date: string) => `guess:day:${date}:entries`;
const PEAK_KEY = (date: string) => `guess:day:${date}:peak`;

export async function recordPeakCandidate(score: number, now: Date = new Date()): Promise<void> {
  const date = datePT(now);
  try {
    const existing = (await kv.get<number>(PEAK_KEY(date))) ?? -1;
    if (score > existing) {
      await kv.set(PEAK_KEY(date), score, { ex: 4 * 24 * 60 * 60 });
    }
  } catch (err) {
    console.warn("[Guess] recordPeakCandidate failed:", err);
  }
}

export async function getPeak(date: string): Promise<number | null> {
  try {
    const v = await kv.get<number>(PEAK_KEY(date));
    return typeof v === "number" && v >= 0 ? v : null;
  } catch {
    return null;
  }
}

export async function submitGuess(date: string, g: Guess): Promise<void> {
  try {
    await kv.hset(GUESSES_KEY(date), { [g.userId]: JSON.stringify(g) });
    await kv.expire(GUESSES_KEY(date), 10 * 24 * 60 * 60);
  } catch (err) {
    console.error("[Guess] submitGuess failed:", err);
    throw new Error("storage_unavailable");
  }
}

async function getAllGuesses(date: string): Promise<Guess[]> {
  try {
    const raw = (await kv.hgetall<Record<string, string>>(GUESSES_KEY(date))) || {};
    return Object.values(raw)
      .map((v) => {
        try {
          return typeof v === "string" ? (JSON.parse(v) as Guess) : (v as Guess);
        } catch {
          return null;
        }
      })
      .filter((g): g is Guess => g !== null);
  } catch {
    return [];
  }
}

export async function getDayGuess(
  date: string,
  userId: string,
  now: Date = new Date(),
): Promise<DayGuess> {
  const [all, peak] = await Promise.all([getAllGuesses(date), getPeak(date)]);
  const revealed = isRevealed(date, now);
  const mine = all.find((g) => g.userId === userId) ?? null;

  const totalPlays = all.length;
  const averageGuess =
    totalPlays > 0 ? Math.round(all.reduce((s, g) => s + g.guess, 0) / totalPlays) : null;

  let myError: number | null = null;
  let top: DayGuess["top"] = [];

  if (revealed && peak !== null) {
    if (mine) myError = Math.abs(mine.guess - peak);
    top = all
      .map((g) => ({ handle: g.handle || "anon", guess: g.guess, error: Math.abs(g.guess - peak) }))
      .sort((a, b) => a.error - b.error)
      .slice(0, 5);
  }

  return {
    date,
    revealHour: REVEAL_HOUR_PT,
    isRevealed: revealed,
    actualPeak: revealed ? peak : null,
    myGuess: mine,
    myError,
    totalPlays,
    averageGuess,
    top,
  };
}
