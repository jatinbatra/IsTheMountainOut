import { kv } from "@vercel/kv";

const TZ = "America/Los_Angeles";
const PICKS_KEY = (week: string) => `pool:week:${week}:picks`;
const ACTUALS_KEY = (week: string) => `pool:week:${week}:actuals`;
const SETTLED_KEY = (week: string) => `pool:week:${week}:settled`;
const SCORES_KEY = (week: string) => `pool:week:${week}:scores`;
const CURRENT_WEEK_KEY = "pool:current";

export interface Pick {
  userId: string;
  handle: string;
  picks: number[];
  submittedAt: string;
}

export interface Standing {
  userId: string;
  handle: string;
  error: number;
  picks: number[];
}

export interface WeekInfo {
  id: string;
  startDate: string;
  endDate: string;
  locksAt: string;
  isLocked: boolean;
}

function laDate(d: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const day = Number(parts.find((p) => p.type === "day")!.value);
  return new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
}

export function getWeekInfo(now: Date = new Date()): WeekInfo {
  const today = laDate(now);
  const dow = today.getUTCDay();
  const daysToMonday = (dow + 6) % 7;
  const monday = new Date(today);
  monday.setUTCDate(monday.getUTCDate() - daysToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);

  const year = monday.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const weekNum = Math.floor((+monday - +jan1) / (7 * 86400000)) + 1;
  const id = `${year}-W${String(weekNum).padStart(2, "0")}`;

  const locksAt = new Date(monday);
  locksAt.setUTCHours(8, 0, 0, 0);

  const isLocked = now >= locksAt;
  const startDate = monday.toISOString().split("T")[0];
  const endDate = sunday.toISOString().split("T")[0];

  return { id, startDate, endDate, locksAt: locksAt.toISOString(), isLocked };
}

export async function submitPick(week: string, pick: Pick): Promise<void> {
  try {
    await kv.hset(PICKS_KEY(week), { [pick.userId]: JSON.stringify(pick) });
  } catch (err) {
    console.error("[Pool] submitPick failed:", err);
    throw new Error("storage_unavailable");
  }
}

export async function getPick(week: string, userId: string): Promise<Pick | null> {
  try {
    const raw = await kv.hget<string>(PICKS_KEY(week), userId);
    if (!raw) return null;
    if (typeof raw === "object") return raw as Pick;
    return JSON.parse(raw) as Pick;
  } catch {
    return null;
  }
}

export async function getAllPicks(week: string): Promise<Pick[]> {
  try {
    const raw = (await kv.hgetall<Record<string, string>>(PICKS_KEY(week))) || {};
    return Object.values(raw)
      .map((v) => {
        try {
          return typeof v === "string" ? (JSON.parse(v) as Pick) : (v as Pick);
        } catch {
          return null;
        }
      })
      .filter((p): p is Pick => p !== null);
  } catch {
    return [];
  }
}

export async function recordDailyActual(score: number): Promise<void> {
  const info = getWeekInfo();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const weekStart = new Date(`${info.startDate}T12:00:00Z`);
  const todayDate = new Date(`${today}T12:00:00Z`);
  const idx = Math.round((+todayDate - +weekStart) / 86400000);
  if (idx < 0 || idx > 6) return;

  try {
    const actuals = ((await kv.get<number[]>(ACTUALS_KEY(info.id))) || Array(7).fill(-1)) as number[];
    if (score > actuals[idx]) actuals[idx] = score;
    await kv.set(ACTUALS_KEY(info.id), actuals);
  } catch {
    // ignore
  }
}

export async function getStandings(week: string): Promise<Standing[]> {
  try {
    const cached = await kv.get<Standing[]>(SCORES_KEY(week));
    if (cached) return cached;
  } catch {
    // fall through to compute
  }

  const picks = await getAllPicks(week);
  const actuals = ((await kv.get<number[]>(ACTUALS_KEY(week))) || []) as number[];
  const filledActuals = actuals.filter((v) => v >= 0);
  if (filledActuals.length === 0) return [];

  const standings: Standing[] = picks.map((p) => {
    let err = 0;
    for (let i = 0; i < Math.min(p.picks.length, actuals.length); i++) {
      if (actuals[i] >= 0) err += Math.abs(p.picks[i] - actuals[i]);
    }
    return { userId: p.userId, handle: p.handle, error: err, picks: p.picks };
  });

  standings.sort((a, b) => a.error - b.error);
  return standings;
}

export async function settleWeekIfDue(): Promise<void> {
  const current = getWeekInfo();
  const actuals = ((await kv.get<number[]>(ACTUALS_KEY(current.id))) || []) as number[];

  const last = getWeekInfo(new Date(Date.now() - 8 * 86400000));
  const lastSettled = await kv.get<string>(SETTLED_KEY(last.id));
  if (!lastSettled) {
    const standings = await getStandings(last.id);
    if (standings.length > 0) {
      await kv.set(SCORES_KEY(last.id), standings);
      await kv.set(SETTLED_KEY(last.id), new Date().toISOString());
    }
  }

  const todayIdx = (() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
    const start = new Date(`${current.startDate}T12:00:00Z`);
    const now = new Date(`${today}T12:00:00Z`);
    return Math.round((+now - +start) / 86400000);
  })();

  if (todayIdx >= 0 && todayIdx < 7) {
    const existing = actuals.length === 7 ? actuals : Array(7).fill(-1);
    const current_marker = await kv.get<string>(CURRENT_WEEK_KEY);
    if (current_marker !== current.id) {
      await kv.set(CURRENT_WEEK_KEY, current.id);
    }
    await kv.set(ACTUALS_KEY(current.id), existing);
  }
}
