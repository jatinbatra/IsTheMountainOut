const CLEAR_THRESHOLD = 76;
const MIN_WINDOW_HOURS = 2;

interface HourlyPoint {
  time: string;
  score: number;
}

interface DailyPoint {
  date: string;
  dayLabel: string;
  score: number;
}

export interface ClearWindow {
  kind: "now" | "today" | "upcoming";
  startIso: string;
  endIso?: string;
  dayLabel: string;
  peakScore: number;
  hours: number;
}

function parseTime(iso: string): Date {
  return new Date(iso);
}

function formatHourPT(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function sameDayLabel(iso: string, nowIso: string): string {
  const d = parseTime(iso);
  const now = new Date(nowIso);
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  if (d <= midnight) return "today";
  const tomorrowEnd = new Date(midnight);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  if (d <= tomorrowEnd) return "tomorrow";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "America/Los_Angeles",
  });
}

export function findNextClearWindow(
  hourly: HourlyPoint[] | undefined,
  daily: DailyPoint[] | undefined,
  currentScore: number,
  nowIso: string = new Date().toISOString(),
): ClearWindow | null {
  const now = new Date(nowIso);

  if (hourly && hourly.length) {
    const upcoming = hourly.filter((h) => parseTime(h.time) >= new Date(now.getTime() - 30 * 60 * 1000));

    if (currentScore >= CLEAR_THRESHOLD) {
      let peak = currentScore;
      let endIso: string | undefined;
      for (const h of upcoming) {
        if (h.score < CLEAR_THRESHOLD) {
          endIso = h.time;
          break;
        }
        peak = Math.max(peak, h.score);
      }
      return {
        kind: "now",
        startIso: now.toISOString(),
        endIso,
        dayLabel: "now",
        peakScore: peak,
        hours: endIso
          ? Math.max(1, Math.round((parseTime(endIso).getTime() - now.getTime()) / 3_600_000))
          : upcoming.length,
      };
    }

    let runStart = -1;
    let runPeak = 0;
    for (let i = 0; i < upcoming.length; i++) {
      const h = upcoming[i];
      if (h.score >= CLEAR_THRESHOLD) {
        if (runStart === -1) runStart = i;
        runPeak = Math.max(runPeak, h.score);
      } else if (runStart !== -1) {
        const runLen = i - runStart;
        if (runLen >= MIN_WINDOW_HOURS) {
          const startIso = upcoming[runStart].time;
          const endIso = h.time;
          return {
            kind: parseTime(startIso).toDateString() === now.toDateString() ? "today" : "upcoming",
            startIso,
            endIso,
            dayLabel: sameDayLabel(startIso, nowIso),
            peakScore: runPeak,
            hours: runLen,
          };
        }
        runStart = -1;
        runPeak = 0;
      }
    }

    if (runStart !== -1 && upcoming.length - runStart >= MIN_WINDOW_HOURS) {
      const startIso = upcoming[runStart].time;
      const lastIso = upcoming[upcoming.length - 1].time;
      return {
        kind: parseTime(startIso).toDateString() === now.toDateString() ? "today" : "upcoming",
        startIso,
        endIso: lastIso,
        dayLabel: sameDayLabel(startIso, nowIso),
        peakScore: runPeak,
        hours: upcoming.length - runStart,
      };
    }
  }

  if (daily && daily.length) {
    const upcoming = daily.filter((d) => parseTime(d.date).getTime() >= new Date(now.toDateString()).getTime());
    const hit = upcoming.find((d) => d.score >= CLEAR_THRESHOLD);
    if (hit) {
      return {
        kind: "upcoming",
        startIso: hit.date,
        dayLabel: hit.dayLabel,
        peakScore: hit.score,
        hours: 0,
      };
    }
  }

  return null;
}

export function describeWindow(w: ClearWindow): string {
  if (w.kind === "now") {
    if (w.endIso) return `Clear until ~${formatHourPT(w.endIso)} today`;
    return `Clear through the rest of the forecast`;
  }
  if (w.kind === "today" || w.kind === "upcoming") {
    if (w.endIso) {
      return `${cap(w.dayLabel)} ${formatHourPT(w.startIso)}–${formatHourPT(w.endIso)}`;
    }
    return `${cap(w.dayLabel)}, peak ${w.peakScore}/100`;
  }
  return "";
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
