// Client-only streak tracker. Anonymous, localStorage-backed, no login.
// A "caught day" is any calendar day (America/Los_Angeles) on which the user
// loaded the page while the mountain was visible (score >= 50).

const KEY = "itmo:streak:v1";
const TZ = "America/Los_Angeles";

export interface StreakState {
  current: number;
  best: number;
  totalCaught: number;
  lastCaughtDay: string | null;
  firstSeenDay: string;
}

function todayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

function daysBetween(a: string, b: string): number {
  const toMs = (s: string) => new Date(`${s}T12:00:00Z`).getTime();
  return Math.round((toMs(b) - toMs(a)) / 86_400_000);
}

function read(): StreakState {
  if (typeof window === "undefined") {
    return { current: 0, best: 0, totalCaught: 0, lastCaughtDay: null, firstSeenDay: todayKey() };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const fresh: StreakState = {
        current: 0,
        best: 0,
        totalCaught: 0,
        lastCaughtDay: null,
        firstSeenDay: todayKey(),
      };
      window.localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as StreakState;
  } catch {
    return { current: 0, best: 0, totalCaught: 0, lastCaughtDay: null, firstSeenDay: todayKey() };
  }
}

function write(state: StreakState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked — silently skip. Streak is a nice-to-have.
  }
}

export function getStreak(): StreakState {
  const state = read();
  if (state.lastCaughtDay && daysBetween(state.lastCaughtDay, todayKey()) > 1) {
    const reset = { ...state, current: 0 };
    write(reset);
    return reset;
  }
  return state;
}

export function recordVisit(isVisible: boolean): StreakState {
  const state = read();
  const today = todayKey();

  if (!isVisible) {
    if (state.lastCaughtDay && daysBetween(state.lastCaughtDay, today) > 1 && state.current !== 0) {
      const reset = { ...state, current: 0 };
      write(reset);
      return reset;
    }
    return state;
  }

  if (state.lastCaughtDay === today) return state;

  const gap = state.lastCaughtDay ? daysBetween(state.lastCaughtDay, today) : 1;
  const nextCurrent = gap === 1 ? state.current + 1 : 1;

  const next: StreakState = {
    current: nextCurrent,
    best: Math.max(state.best, nextCurrent),
    totalCaught: state.totalCaught + 1,
    lastCaughtDay: today,
    firstSeenDay: state.firstSeenDay || today,
  };
  write(next);
  return next;
}
