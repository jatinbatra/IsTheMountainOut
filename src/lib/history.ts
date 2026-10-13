import { kv } from "@vercel/kv";
import { VISIBLE_THRESHOLD } from "@/lib/visibility";
import type { Signals } from "@/lib/telemetry";

// ── Mountain log ─────────────────────────────────────────────────────
// Records what the mountain was doing over time, at 15-minute resolution.
//
// Observations are written opportunistically by any server code path that
// computes live visibility (the status API every visitor polls, the ISR page
// render, the cron). Each 15-minute slot is claimed with HSETNX, so no matter
// how much traffic arrives only the first observation per slot is kept and
// the daily aggregate / change log are updated at most once per slot. This
// means history accumulates even when no cron runs.
//
// Storage layout (Redis / Vercel KV):
//   obs:day:<YYYY-MM-DD>  hash  "HH:MM" -> Observation JSON   (TTL 400d)
//   calendar:data         json  date -> DaySummary            (almanac compat)
//   obs:events            list  newest-first state changes    (last 300)
//   obs:last              json  last recorded Observation

const TZ = "America/Los_Angeles";
const DAY_TTL_SECONDS = 400 * 24 * 60 * 60;
const MAX_EVENTS = 300;
const CALENDAR_KEEP_DAYS = 400;

export type MountainState = "out" | "hidden" | "night";

export interface Observation {
  ts: string; // ISO timestamp
  score: number;
  state: MountainState;
  /** Full telemetry snapshot (readings logged before telemetry existed lack it). */
  signals?: Signals;
}

export interface DaySummary {
  score: number; // peak daytime score (-1 if no daytime observation yet)
  isVisible: boolean; // was it out at any point during daylight
  outSlots?: number; // 15-min daylight slots where it was out
  daySlots?: number; // 15-min daylight slots observed
  firstOut?: string; // ISO of first "out" observation
  lastOut?: string; // ISO of last "out" observation
}

export type CalendarData = Record<string, DaySummary>;

export interface MountainEvent {
  ts: string;
  state: MountainState;
  score: number;
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/** YYYY-MM-DD and HH:MM (15-min floor) in Pacific time. */
export function ptParts(date: Date = new Date()): { day: string; slot: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const minute = Math.floor(Number(get("minute")) / 15) * 15;
  return {
    day: `${get("year")}-${get("month")}-${get("day")}`,
    slot: `${get("hour")}:${String(minute).padStart(2, "0")}`,
  };
}

export function ptDay(date: Date = new Date()): string {
  return ptParts(date).day;
}

/** Shift a YYYY-MM-DD string by whole days (calendar arithmetic, DST-safe). */
export function shiftDay(day: string, offset: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offset));
  return dt.toISOString().slice(0, 10);
}

export function stateFor(score: number, isDay: boolean): MountainState {
  if (!isDay) return "night";
  return score >= VISIBLE_THRESHOLD ? "out" : "hidden";
}

/**
 * Record the current mountain reading. Safe to call on every request: it is
 * a single HSETNX unless this is the first reading of a new 15-minute slot.
 * Never throws — the log must not break the page.
 */
export async function recordObservation(input: {
  score: number;
  isDay: boolean;
  isFallback?: boolean;
  at?: Date;
  /** Builds the telemetry snapshot; only called when this reading claims a new slot. */
  buildSignals?: () => Promise<Signals>;
}): Promise<void> {
  if (input.isFallback) return; // never log estimated/mock data as history
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (!isStorageConfigured()) return;

  const at = input.at ?? new Date();
  const { day, slot } = ptParts(at);
  const obs: Observation = {
    ts: at.toISOString(),
    score: Math.round(input.score),
    state: stateFor(input.score, input.isDay),
  };

  try {
    const dayKey = `obs:day:${day}`;
    const claimed = await kv.hsetnx(dayKey, slot, JSON.stringify(obs));
    if (claimed !== 1) return; // slot already recorded

    if (input.buildSignals) {
      // Claim first with the bare reading (cheap, race-free), then attach the
      // full snapshot — so normal traffic never pays for building it.
      try {
        obs.signals = await input.buildSignals();
        await kv.hset(dayKey, { [slot]: JSON.stringify(obs) });
      } catch (err) {
        console.warn("[history] signals failed:", err);
      }
    }
    await kv.expire(dayKey, DAY_TTL_SECONDS);
    await Promise.all([updateDaySummary(day, obs), updateEvents(obs)]);
  } catch (err) {
    console.warn("[history] record failed:", err);
  }
}

async function updateDaySummary(day: string, obs: Observation) {
  if (obs.state === "night") return; // night says nothing about the day

  const data = (await kv.get<CalendarData>("calendar:data")) || {};
  const prev = data[day];
  const isOut = obs.state === "out";
  const next: DaySummary = {
    score: Math.max(prev?.score ?? -1, obs.score),
    isVisible: Boolean(prev?.isVisible) || isOut,
    outSlots: (prev?.outSlots ?? 0) + (isOut ? 1 : 0),
    daySlots: (prev?.daySlots ?? 0) + 1,
    firstOut: prev?.firstOut ?? (isOut ? obs.ts : undefined),
    lastOut: isOut ? obs.ts : prev?.lastOut,
  };
  data[day] = next;

  const cutoff = shiftDay(day, -CALENDAR_KEEP_DAYS);
  for (const key of Object.keys(data)) {
    if (key < cutoff) delete data[key];
  }
  await kv.set("calendar:data", data);
}

async function updateEvents(obs: Observation) {
  const last = await kv.get<Observation>("obs:last");
  await kv.set("obs:last", obs);
  if (last && last.state === obs.state) return;
  const event: MountainEvent = { ts: obs.ts, state: obs.state, score: obs.score };
  await kv.lpush("obs:events", JSON.stringify(event));
  await kv.ltrim("obs:events", 0, MAX_EVENTS - 1);
}

// ── Reading ──────────────────────────────────────────────────────────

function parseJson<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "object") return value as T; // client may auto-parse
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return null;
  }
}

export async function getDayObservations(day: string): Promise<(Observation & { slot: string })[]> {
  const raw = (await kv.hgetall<Record<string, unknown>>(`obs:day:${day}`)) || {};
  return Object.entries(raw)
    .map(([slot, v]) => {
      const o = parseJson<Observation>(v);
      return o ? { ...o, slot } : null;
    })
    .filter((o): o is Observation & { slot: string } => o !== null)
    .sort((a, b) => a.slot.localeCompare(b.slot));
}

export async function getRecentEvents(limit = 20): Promise<MountainEvent[]> {
  const raw = (await kv.lrange<unknown>("obs:events", 0, limit - 1)) || [];
  return raw.map((v) => parseJson<MountainEvent>(v)).filter((e): e is MountainEvent => e !== null);
}

export async function getCalendar(): Promise<CalendarData> {
  return (await kv.get<CalendarData>("calendar:data")) || {};
}

export interface StreakInfo {
  type: "out" | "gloom";
  days: number;
  since: string;
}

/**
 * Current run of consecutive out / hidden days, derived from the daily log.
 * Today only counts once it has daylight observations, so a streak isn't
 * broken just because the sun hasn't come up yet.
 */
export function computeCurrentStreak(data: CalendarData, today = ptDay()): StreakInfo | null {
  const todayHasDaylight = (data[today]?.score ?? -1) >= 0;
  let day = todayHasDaylight ? today : shiftDay(today, -1);
  const first = data[day];
  if (!first || first.score < 0) return null;

  const type = first.isVisible ? "out" : "gloom";
  let days = 0;
  let since = day;
  while (data[day] && data[day].score >= 0 && (data[day].isVisible ? "out" : "gloom") === type) {
    days++;
    since = day;
    day = shiftDay(day, -1);
  }
  return { type, days, since };
}
